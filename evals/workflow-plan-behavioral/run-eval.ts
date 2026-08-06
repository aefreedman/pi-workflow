import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hasImplementationReadyPlanDraft } from "./semantic-checkers.mjs";

type EvalCase = {
  id: string;
  fixture: string;
  prompt: string;
  prepare?: "collision";
  stoppedNoAction?: boolean;
  expectedChecks: string[];
};
type Snapshot = Record<string, string>;
type ToolCall = { toolCallId: string; name: string; args: unknown; isError?: boolean; result?: unknown };
type SanitizedToolCall = { name: string; args: string; outcome?: "succeeded" | "failed" };
type Evidence = {
  answer: string;
  toolCalls: ToolCall[];
  before: Snapshot;
  after: Snapshot;
  durationMs: number;
  exitCode: number | null;
  stderr: string;
  usage: { input: number; output: number; totalTokens: number };
};

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, "../..");
const workspaceRoot = resolve(packageRoot, "..");
const fixtureRoot = join(here, "fixtures");
const casesPath = join(here, "cases.json");
const MAX_TOOL_CALLS = 40;
const MAX_REPORTED_TOOL_CALLS = 40;
const MAX_TRACE_ARG_CHARS = 600;
const MAX_TRACE_CALL_CHARS = 2_000;
const MAX_TRACE_DEPTH = 4;
const MAX_TRACE_ITEMS = 20;
const MAX_ANSWER_CHARS = 16_000;
const MAX_TOTAL_TOKENS = 48_000;
const hostDate = new Date().toISOString().slice(0, 10);

function resolvePiCliPath(): string {
  const candidates = [
    process.env.PI_CLI_PATH,
    process.env.APPDATA && join(process.env.APPDATA, "npm/node_modules/@earendil-works/pi-coding-agent/dist/cli.js"),
    process.env.npm_config_prefix && join(process.env.npm_config_prefix, "lib/node_modules/@earendil-works/pi-coding-agent/dist/cli.js"),
  ].filter((value): value is string => Boolean(value));
  const path = candidates.find(existsSync);
  if (!path) throw new Error("Could not resolve Pi CLI. Set PI_CLI_PATH to @earendil-works/pi-coding-agent/dist/cli.js.");
  return path;
}

function parseArgs(args: string[]) {
  let trials = 1;
  let caseIds: string[] = [];
  let model: string | undefined;
  let output: string | undefined;
  let keep = false;
  let timeoutSeconds = 180;
  let concurrency = 1;
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--trials") trials = Number(args[++index]);
    else if (value === "--cases") caseIds = String(args[++index]).split(",").filter(Boolean);
    else if (value === "--model") model = args[++index];
    else if (value === "--output") output = resolve(args[++index]);
    else if (value === "--keep") keep = true;
    else if (value === "--timeout-seconds") timeoutSeconds = Number(args[++index]);
    else if (value === "--concurrency") concurrency = Number(args[++index]);
    else throw new Error(`Unknown argument: ${value}`);
  }
  if (!Number.isInteger(trials) || trials < 1 || trials > 3) throw new Error("--trials must be between 1 and 3");
  if (!Number.isInteger(timeoutSeconds) || timeoutSeconds < 30 || timeoutSeconds > 300) throw new Error("--timeout-seconds must be between 30 and 300");
  // Isolated agent runs share package extensions and provider credentials; sequential is deliberate.
  if (concurrency !== 1) throw new Error("--concurrency is currently fixed at 1 for bounded isolated prompt trials");
  return { trials, caseIds, model, output, keep, timeoutSeconds, concurrency };
}

async function walk(root: string, current = root): Promise<string[]> {
  const entries = await readdir(current, { withFileTypes: true });
  const paths: string[] = [];
  for (const entry of entries) {
    const full = join(current, entry.name);
    if (entry.isDirectory()) paths.push(...await walk(root, full));
    else if (entry.isFile()) paths.push(full);
  }
  return paths;
}

async function snapshot(root: string): Promise<Snapshot> {
  const result: Snapshot = {};
  for (const path of await walk(root)) result[relative(root, path).replaceAll("\\", "/")] = createHash("sha256").update(await readFile(path)).digest("hex");
  return result;
}

function changed(before: Snapshot, after: Snapshot): string[] {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((path) => before[path] !== after[path]).sort();
}

function assistantText(message: any): string {
  return message?.role === "assistant" && Array.isArray(message.content)
    ? message.content.filter((part: any) => part?.type === "text").map((part: any) => String(part.text ?? "")).join("")
    : "";
}

function sanitizeTraceText(value: string): string {
  const redacted = value.replace(/\b(?:bearer\s+|token[=:]\s*|api[_-]?key[=:]\s*|secret[=:]\s*)[^\s,;]+/gi, "[REDACTED]");
  return redacted.length <= MAX_TRACE_ARG_CHARS ? redacted : `${redacted.slice(0, MAX_TRACE_ARG_CHARS)}…[truncated]`;
}

function sanitizeTraceValue(value: unknown, depth = 0): unknown {
  if (typeof value === "string") return sanitizeTraceText(value);
  if (value === null || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "undefined") return "[undefined]";
  if (depth >= MAX_TRACE_DEPTH) return "[truncated depth]";
  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_TRACE_ITEMS).map((item) => sanitizeTraceValue(item, depth + 1));
    if (value.length > MAX_TRACE_ITEMS) items.push(`[${value.length - MAX_TRACE_ITEMS} items omitted]`);
    return items;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, MAX_TRACE_ITEMS).map(([key, item]) => [key, /(?:authorization|cookie|credential|password|secret|token|api[_-]?key|content|body|text|prompt|patch|replacement|oldtext|newtext)/i.test(key) ? "[REDACTED]" : sanitizeTraceValue(item, depth + 1)]);
    if (Object.keys(value as Record<string, unknown>).length > MAX_TRACE_ITEMS) entries.push(["[truncated]", "additional fields omitted"]);
    return Object.fromEntries(entries);
  }
  return `[${typeof value}]`;
}

function sanitizeToolCallTrace(calls: ToolCall[]): { calls: SanitizedToolCall[]; omittedCalls: number } {
  const kept = calls.length <= MAX_REPORTED_TOOL_CALLS
    ? calls
    : [...calls.slice(0, MAX_REPORTED_TOOL_CALLS / 2), ...calls.slice(-MAX_REPORTED_TOOL_CALLS / 2)];
  return {
    calls: kept.map((call) => {
      const args = JSON.stringify(sanitizeTraceValue(call.args));
      return {
        name: call.name,
        args: args.length <= MAX_TRACE_CALL_CHARS ? args : `${args.slice(0, MAX_TRACE_CALL_CHARS)}…[truncated]`,
        ...(call.isError === undefined ? {} : { outcome: call.isError ? "failed" as const : "succeeded" as const }),
      };
    }),
    omittedCalls: calls.length - kept.length,
  };
}

async function prepare(workspace: string, testCase: EvalCase): Promise<void> {
  if (testCase.prepare === "collision") {
    await writeFile(join(workspace, "docs", "plans", `${hostDate}-plan-importer-retry-policy-plan.md`), "# Existing authoritative plan\n", "utf8");
  }
}

async function runCase(testCase: EvalCase, trial: number, options: ReturnType<typeof parseArgs>): Promise<{ evidence: Evidence; workspace?: string }> {
  const workspace = await mkdtemp(join(tmpdir(), `pi-workflow-plan-${testCase.id}-${trial}-`));
  await cp(join(fixtureRoot, testCase.fixture), workspace, { recursive: true });
  await prepare(workspace, testCase);
  const before = await snapshot(workspace);
  const tools = ["read", "write", "edit"];
  const args = [
    "--mode", "json", "--no-session", "--approve", "--no-context-files", "--no-extensions", "--no-skills", "--no-prompt-templates",
    "--prompt-template", join(packageRoot, "prompts", "core", "plan.md"),
    "--tools", tools.join(","), "--thinking", "minimal",
    "--append-system-prompt", `Evaluation boundary: only the fresh temporary workspace is writable. Host date for this isolated evaluation is ${hostDate}; use it for any YYYY-MM-DD plan filename. Keep the response concise (under 1200 tokens), use at most ${MAX_TOOL_CALLS} tools, and do not run shell commands, commits, package installs, or external-network actions.`,
  ];
  if (options.model) args.push("--model", options.model);
  const prompt = testCase.prompt.replace("YYYY-MM-DD", hostDate);
  args.push(prompt);
  const child = spawn(process.execPath, [resolvePiCliPath(), ...args], { cwd: workspace, windowsHide: true, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8"); child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => { stdout += chunk; }); child.stderr.on("data", (chunk) => { stderr += chunk; });
  const started = Date.now();
  const timer = setTimeout(() => child.kill("SIGTERM"), options.timeoutSeconds * 1000);
  const exitCode = await new Promise<number | null>((done) => child.on("close", done));
  clearTimeout(timer);
  const events = stdout.split(/\r?\n/).filter(Boolean).flatMap((line) => { try { return [JSON.parse(line)]; } catch { return []; } });
  const toolEnds = new Map(events
    .filter((event: any) => event.type === "tool_execution_end")
    .map((event: any) => [String(event.toolCallId), { isError: Boolean(event.isError), result: event.result }]));
  const toolCalls = events.filter((event: any) => event.type === "tool_execution_start").map((event: any) => {
    const toolCallId = String(event.toolCallId);
    const completed = toolEnds.get(toolCallId);
    return {
      toolCallId,
      name: String(event.toolName),
      args: event.args,
      ...(completed === undefined ? {} : completed),
    };
  });
  const answers = events.filter((event: any) => event.type === "message_end").map((event: any) => assistantText(event.message)).filter(Boolean);
  const usage = events.filter((event: any) => event.type === "message_end" && event.message?.role === "assistant").at(-1)?.message?.usage ?? {};
  const evidence: Evidence = { answer: answers.at(-1) ?? "", toolCalls, before, after: await snapshot(workspace), durationMs: Date.now() - started, exitCode, stderr, usage: { input: Number(usage.input ?? 0), output: Number(usage.output ?? 0), totalTokens: Number(usage.totalTokens ?? 0) } };
  if (!options.keep) await rm(workspace, { recursive: true, force: true });
  return { evidence, ...(options.keep ? { workspace } : {}) };
}

function check(id: string, evidence: Evidence, timeoutSeconds: number): boolean {
  const paths = changed(evidence.before, evidence.after);
  const planPaths = paths.filter((path) => path.startsWith("docs/plans/"));
  const calls = evidence.toolCalls;
  const callsNamed = (name: string) => calls.filter((call) => call.name === name);
  const args = (name: string) => callsNamed(name).map((call) => JSON.stringify(call.args).replaceAll("\\", "/")).join("\n");
  switch (id) {
    case "plan_file_created": return planPaths.some((path) => evidence.before[path] === undefined && evidence.after[path] !== undefined);
    case "no_plan_file_created": return planPaths.length === 0;
    case "no_new_plan_file": return planPaths.every((path) => evidence.before[path] !== undefined);
    case "collision_preserved": return Object.entries(evidence.before).some(([path, hash]) => path.startsWith("docs/plans/") && evidence.after[path] === hash);
    case "source_read": return /src\/importer\.ts/.test(args("read"));
    case "project_instructions_read": return /AGENTS\.md/.test(args("read"));
    case "plan_semantic_draft": return hasImplementationReadyPlanDraft(evidence.answer);
    case "degraded_disclosed": return /degraded|reference.{0,40}(unavailable|missing|gap)|capability.{0,40}gap/i.test(evidence.answer);
    case "no_source_changes": return !paths.some((path) => path.startsWith("src/") || path.startsWith("Assets/"));
    case "bounded_trace": return evidence.exitCode === 0 && evidence.durationMs <= (timeoutSeconds + 10) * 1000 && calls.length <= MAX_TOOL_CALLS && evidence.answer.length <= MAX_ANSWER_CHARS && evidence.usage.totalTokens <= MAX_TOTAL_TOKENS;
    default: throw new Error(`Unknown check: ${id}`);
  }
}

const options = parseArgs(process.argv.slice(2));
const allCases = JSON.parse(await readFile(casesPath, "utf8")) as { schemaVersion: number; cases: EvalCase[] };
if (allCases.schemaVersion !== 1) throw new Error("Unsupported behavioral eval case schema");
const selected = options.caseIds.length ? allCases.cases.filter((item) => options.caseIds.includes(item.id)) : allCases.cases;
if (!selected.length || (options.caseIds.length && selected.length !== options.caseIds.length)) throw new Error("One or more requested case IDs were not found");
const results: unknown[] = [];
for (const testCase of selected) for (let trial = 1; trial <= options.trials; trial += 1) {
  process.stderr.write(`Running ${testCase.id} trial ${trial}...\n`);
  const { evidence, workspace } = await runCase(testCase, trial, options);
  const checks = Object.fromEntries(testCase.expectedChecks.map((id) => [id, check(id, evidence, options.timeoutSeconds)]));
  results.push({ id: testCase.id, trial, passed: evidence.exitCode === 0 && Object.values(checks).every(Boolean), checks, metrics: { durationMs: evidence.durationMs, toolCalls: evidence.toolCalls.length, usage: evidence.usage, changedPaths: changed(evidence.before, evidence.after) }, toolCallTrace: sanitizeToolCallTrace(evidence.toolCalls), answer: evidence.answer.slice(0, MAX_ANSWER_CHARS), stderr: evidence.stderr.slice(0, 4000), workspace });
}
const passed = (results as Array<{ passed: boolean }>).filter((result) => result.passed).length;
const report = { generatedAt: new Date().toISOString(), options: { ...options, output: undefined }, summary: { passed, total: results.length }, results };
const outputPath = options.output ?? join(tmpdir(), "pi-workflow-evals", "workflow-plan-latest-results.json");
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ outputPath, ...report.summary }, null, 2));

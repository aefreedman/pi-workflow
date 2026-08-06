import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  hasFocusedFailureCorrectionPassTrace,
  hasSingleSpecialistDirectVerificationTrace,
} from "./observability-checkers.mjs";
import { hasWorkHandoffEvidence } from "./handoff-checkers.mjs";

type EvalCase = { id: string; fixture: string; prompt: string; prepare?: "plan" | "failing-test"; expectedChecks: string[] };
type Snapshot = Record<string, string>;
type ToolCall = { toolCallId: string; name: string; args: unknown; isError?: boolean; result?: unknown };
type IsolationEvidence = { protectedBefore: Snapshot; protectedAfter: Snapshot; protectedChanged: string[] };
type Evidence = { answer: string; toolCalls: ToolCall[]; before: Snapshot; after: Snapshot; durationMs: number; exitCode: number | null; stderr: string; usage: { input: number; output: number; totalTokens: number }; isolation: IsolationEvidence };

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, "../..");
const fixtureRoot = join(here, "fixtures");
const MAX_TOOL_CALLS = 40;
const MAX_ANSWER_CHARS = 16_000;
const MAX_TOTAL_TOKENS = 48_000;
const MAX_TRACE_ARG_CHARS = 600;

function resolvePiCliPath(): string {
  const candidates = [process.env.PI_CLI_PATH, process.env.APPDATA && join(process.env.APPDATA, "npm/node_modules/@earendil-works/pi-coding-agent/dist/cli.js"), process.env.npm_config_prefix && join(process.env.npm_config_prefix, "lib/node_modules/@earendil-works/pi-coding-agent/dist/cli.js")].filter((value): value is string => Boolean(value));
  const value = candidates.find(existsSync);
  if (!value) throw new Error("Could not resolve Pi CLI. Set PI_CLI_PATH to @earendil-works/pi-coding-agent/dist/cli.js.");
  return value;
}

function parseArgs(args: string[]) {
  let trials = 1, timeoutSeconds = 180, concurrency = 1, keep = false;
  let caseIds: string[] = [], model: string | undefined, output: string | undefined;
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
  if (concurrency !== 1) throw new Error("--concurrency is currently fixed at 1 for bounded isolated prompt trials");
  return { trials, caseIds, model, output, keep, timeoutSeconds, concurrency };
}

async function walk(root: string, current = root): Promise<string[]> {
  const entries = await readdir(current, { withFileTypes: true });
  const paths: string[] = [];
  for (const entry of entries) { const full = join(current, entry.name); if (entry.isDirectory()) paths.push(...await walk(root, full)); else if (entry.isFile()) paths.push(full); }
  return paths;
}
async function snapshot(root: string): Promise<Snapshot> { const result: Snapshot = {}; for (const file of await walk(root)) result[relative(root, file).replaceAll("\\", "/")] = createHash("sha256").update(await readFile(file)).digest("hex"); return result; }
async function snapshotFiles(files: Readonly<Record<string, string>>): Promise<Snapshot> { const result: Snapshot = {}; for (const [label, file] of Object.entries(files)) result[label] = existsSync(file) ? createHash("sha256").update(await readFile(file)).digest("hex") : "[missing]"; return result; }
function changed(before: Snapshot, after: Snapshot): string[] { return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((file) => before[file] !== after[file]).sort(); }
function assistantText(message: unknown): string { const value = message as { role?: unknown; content?: Array<{ type?: unknown; text?: unknown }> }; return value?.role === "assistant" && Array.isArray(value.content) ? value.content.filter((part) => part?.type === "text").map((part) => String(part.text ?? "")).join("") : ""; }
function sanitizedTrace(calls: ToolCall[]) { return calls.slice(0, MAX_TOOL_CALLS).map((call) => ({ name: call.name, args: JSON.stringify(call.args).replace(/\b(?:bearer\s+|token[=:]\s*|api[_-]?key[=:]\s*|secret[=:]\s*)[^\s,;]+/gi, "[REDACTED]").slice(0, MAX_TRACE_ARG_CHARS), outcome: call.isError ? "failed" : "succeeded" })); }

async function prepare(workspace: string, testCase: EvalCase): Promise<void> {
  if (testCase.prepare === "plan") await writeFile(join(workspace, "WORK-PLAN.md"), "# Authoritative work plan\n\n- [ ] Make retryable HTTP 429 and 5xx responses retry.\n- [ ] Preserve three total attempts.\n", "utf8");
  if (testCase.prepare === "failing-test") await writeFile(join(workspace, "importer.test.mjs"), "// Synthetic focused check is exposed only through work_eval_focused_check.\n", "utf8");
}

async function runCase(testCase: EvalCase, trial: number, options: ReturnType<typeof parseArgs>): Promise<{ evidence: Evidence; workspace?: string }> {
  const workspace = await mkdtemp(join(tmpdir(), `pi-workflow-work-${testCase.id}-${trial}-`));
  const sentinelRoot = await mkdtemp(join(tmpdir(), "pi-workflow-work-protected-"));
  const siblingSentinel = join(sentinelRoot, "DO-NOT-MUTATE.txt");
  await writeFile(siblingSentinel, randomUUID(), "utf8");
  try {
    await cp(join(fixtureRoot, testCase.fixture), workspace, { recursive: true }); await prepare(workspace, testCase);
    const before = await snapshot(workspace);
    const protectedFiles = {
      "package/package.json": join(packageRoot, "package.json"),
      "package/prompts/core/work.md": join(packageRoot, "prompts", "core", "work.md"),
      "outside/sentinel": siblingSentinel,
    };
    const protectedBefore = await snapshotFiles(protectedFiles);
    const extensions = [join(here, "eval-isolation-extension.ts"), join(here, "eval-observability-extension.ts")];
    const tools = ["read", "write", "edit", "work_eval_focused_check", "work_eval_specialist"];
    const args = ["--mode", "json", "--no-session", "--approve", "--no-context-files", "--no-extensions", "--no-skills", "--no-prompt-templates", "--prompt-template", join(packageRoot, "prompts", "core", "work.md"), "--tools", tools.join(","), "--thinking", "minimal", "--append-system-prompt", `Keep the response under 1200 tokens and use at most ${MAX_TOOL_CALLS} tools. Do not run shell commands, commits, package installs, network, tracker, publication, VCS, Unity launch/close, or external actions.`];
    for (const extension of extensions) args.push("--extension", extension);
    if (options.model) args.push("--model", options.model);
    args.push(testCase.prompt);
    const child = spawn(process.execPath, [resolvePiCliPath(), ...args], { cwd: workspace, windowsHide: true, env: { ...process.env, PI_WORKFLOW_EVAL_ROOT: workspace }, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "", stderr = ""; child.stdout.setEncoding("utf8"); child.stderr.setEncoding("utf8"); child.stdout.on("data", (chunk) => { stdout += chunk; }); child.stderr.on("data", (chunk) => { stderr += chunk; });
    const started = Date.now(); const timer = setTimeout(() => child.kill("SIGTERM"), options.timeoutSeconds * 1000); const exitCode = await new Promise<number | null>((done) => child.on("close", done)); clearTimeout(timer);
    const events = stdout.split(/\r?\n/).filter(Boolean).flatMap((line) => { try { return [JSON.parse(line) as { type?: string; toolCallId?: unknown; toolName?: unknown; args?: unknown; isError?: unknown; result?: unknown; message?: unknown }]; } catch { return []; } });
    const ends = new Map(events.filter((event) => event.type === "tool_execution_end").map((event) => [String(event.toolCallId), { isError: Boolean(event.isError), result: event.result }]));
    const toolCalls = events.filter((event) => event.type === "tool_execution_start").map((event) => ({ toolCallId: String(event.toolCallId), name: String(event.toolName), args: event.args, ...ends.get(String(event.toolCallId)) }));
    const answers = events.filter((event) => event.type === "message_end").map((event) => assistantText(event.message)).filter(Boolean);
    const usage = (events.filter((event) => event.type === "message_end").at(-1)?.message as { usage?: { input?: number; output?: number; totalTokens?: number } } | undefined)?.usage ?? {};
    const protectedAfter = await snapshotFiles(protectedFiles);
    const evidence: Evidence = { answer: answers.at(-1) ?? "", toolCalls, before, after: await snapshot(workspace), durationMs: Date.now() - started, exitCode, stderr, usage: { input: Number(usage.input ?? 0), output: Number(usage.output ?? 0), totalTokens: Number(usage.totalTokens ?? 0) }, isolation: { protectedBefore, protectedAfter, protectedChanged: changed(protectedBefore, protectedAfter) } };
    if (!options.keep) await rm(workspace, { recursive: true, force: true }); return { evidence, ...(options.keep ? { workspace } : {}) };
  } finally { await rm(sentinelRoot, { recursive: true, force: true }); }
}

function check(id: string, evidence: Evidence, timeoutSeconds: number): boolean {
  const paths = changed(evidence.before, evidence.after); const calls = evidence.toolCalls;
  const named = (name: string) => calls.filter((call) => call.name === name); const args = (name: string) => named(name).map((call) => JSON.stringify(call.args).replaceAll("\\", "/")).join("\n");
  switch (id) {
    case "source_read": return /importer\.ts/.test(args("read")); case "project_instructions_read": return /AGENTS\.md/.test(args("read"));
    case "authority_read": return /WORK-PLAN\.md/.test(args("read")); case "authority_preserved": return evidence.before["WORK-PLAN.md"] === evidence.after["WORK-PLAN.md"];
    case "source_changed": return paths.some((file) => file === "importer.ts" || file === "Assets/Importer.cs"); case "no_source_changes": return !paths.some((file) => /^(?:importer\.ts|Assets\/)/.test(file));
    case "focused_failure_correction_trace": return hasFocusedFailureCorrectionPassTrace(calls); case "specialist_direct_verification_trace": return hasSingleSpecialistDirectVerificationTrace(calls);
    case "handoff_evidence": return hasWorkHandoffEvidence(evidence.answer);
    case "no_external_tools": return !calls.some((call) => /(?:bash|git|cm|tracker|publish|unity|pipeline)/i.test(call.name)); case "no_false_delegation": return !/delegat(?:ed|ion) (?:was |is )?(?:used|performed|completed)/i.test(evidence.answer);
    case "mutation_isolation": return evidence.isolation.protectedChanged.length === 0; case "bounded_trace": return evidence.exitCode === 0 && evidence.durationMs <= (timeoutSeconds + 10) * 1000 && calls.length <= MAX_TOOL_CALLS && evidence.answer.length <= MAX_ANSWER_CHARS && evidence.usage.totalTokens <= MAX_TOTAL_TOKENS;
    default: throw new Error(`Unknown check: ${id}`);
  }
}

const options = parseArgs(process.argv.slice(2)); const all = JSON.parse(await readFile(join(here, "cases.json"), "utf8")) as { schemaVersion: number; cases: EvalCase[] };
if (all.schemaVersion !== 1) throw new Error("Unsupported behavioral eval case schema"); const selected = options.caseIds.length ? all.cases.filter((item) => options.caseIds.includes(item.id)) : all.cases;
if (!selected.length || (options.caseIds.length && selected.length !== options.caseIds.length)) throw new Error("One or more requested case IDs were not found");
const results: unknown[] = []; for (const testCase of selected) for (let trial = 1; trial <= options.trials; trial += 1) { process.stderr.write(`Running ${testCase.id} trial ${trial}...\n`); const { evidence, workspace } = await runCase(testCase, trial, options); const checks = Object.fromEntries([...testCase.expectedChecks, "mutation_isolation"].map((id) => [id, check(id, evidence, options.timeoutSeconds)])); results.push({ id: testCase.id, trial, passed: evidence.exitCode === 0 && Object.values(checks).every(Boolean), checks, metrics: { durationMs: evidence.durationMs, toolCalls: evidence.toolCalls.length, usage: evidence.usage, changedPaths: changed(evidence.before, evidence.after), protectedChanged: evidence.isolation.protectedChanged }, toolCallTrace: sanitizedTrace(evidence.toolCalls), answer: evidence.answer.slice(0, MAX_ANSWER_CHARS), stderr: evidence.stderr.slice(0, 4000), workspace }); }
const passed = (results as Array<{ passed: boolean }>).filter((result) => result.passed).length; const report = { generatedAt: new Date().toISOString(), options: { ...options, output: undefined }, summary: { passed, total: results.length }, results }; const outputPath = options.output ?? join(tmpdir(), "pi-workflow-evals", "workflow-work-latest-results.json"); await mkdir(dirname(outputPath), { recursive: true }); await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8"); console.log(JSON.stringify({ outputPath, ...report.summary }, null, 2));

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, mkdir, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { evaluateEvalMutationPath } from "../evals/workflow-work-behavioral/isolation.mjs";
import { hasWorkHandoffEvidence } from "../evals/workflow-work-behavioral/handoff-checkers.mjs";
import { hasFocusedFailureCorrectionPassTrace, hasSingleSpecialistDirectVerificationTrace } from "../evals/workflow-work-behavioral/observability-checkers.mjs";

const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const root = new URL("../evals/workflow-work-behavioral/", import.meta.url);
const cases = JSON.parse(readFileSync(new URL("cases.json", root), "utf8"));
const runner = readFileSync(new URL("run-eval.ts", root), "utf8");
const readme = readFileSync(new URL("README.md", root), "utf8");
const gitignore = readFileSync(new URL("../.gitignore", import.meta.url), "utf8");
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const requiredCases = ["direct_scoped_change", "authoritative_plan_immutable", "focused_failure_correction", "default_review_budget", "complete_handoff", "no_unauthorized_external_actions", "absent_agent_control"];

test("work behavioral eval is opt-in, compilable, isolated, and covers workflow evidence", () => {
  assert.match(manifest.scripts["eval:work"], /workflow-work-behavioral\/run-eval\.ts/);
  assert.equal(cases.schemaVersion, 1);
  const byId = new Map(cases.cases.map((item) => [item.id, item]));
  for (const id of requiredCases) assert(byId.has(id), id);
  for (const item of cases.cases) {
    assert.equal(Object.hasOwn(item, "expectedGuidanceTargets"), false, item.id);
    assert.equal(Object.hasOwn(item, "loadReferenceReader"), false, item.id);
  }
  assert.equal(existsSync(new URL("fixtures/starter/AGENTS.md", root)), true);
  assert.equal(existsSync(new URL("fixtures/starter/importer.ts", root)), true);
  for (const text of ["--no-extensions", "--no-skills", "--no-prompt-templates", "work.md", "project_instructions_read", "MAX_TOOL_CALLS = 40", "mkdtemp", "tmpdir", "eval-isolation-extension.ts", "PI_WORKFLOW_EVAL_ROOT", "work_eval_focused_check", "work_eval_specialist", "mutation_isolation", "--concurrency is currently fixed at 1", "sanitizedTrace", "no_external_tools"]) assert(runner.includes(text), text);
  assert.doesNotMatch(runner, /read_package_reference|review_depth_reference|pi-package-references/);
  assert.doesNotMatch(runner, /workflow_guidance|WorkflowGuidance|loadUnityProvider|guidance_before_mutation/);
  assert.match(readme, /provider-backed/i);
  assert.match(readme, /does not duplicate a work runtime engine/i);
  assert.match(readme, /openai-codex\/gpt-5\.6-luna/);
  assert.match(readme, /intentionally deferred/i);
  assert(gitignore.includes("evals/**/results/") && gitignore.includes("evals/**/*.eval-results.json"));
  execFileSync(npx, ["--no-install", "tsc", "--noEmit", "--target", "ES2022", "--module", "NodeNext", "--moduleResolution", "NodeNext", "--strict", "--skipLibCheck", "evals/workflow-work-behavioral/run-eval.ts", "evals/workflow-work-behavioral/eval-isolation-extension.ts", "evals/workflow-work-behavioral/eval-observability-extension.ts"], { cwd: new URL("..", import.meta.url), stdio: "pipe", shell: process.platform === "win32" });
});

test("work handoff checker rejects empty or incomplete answers", () => {
  assert.equal(hasWorkHandoffEvidence(""), false);
  assert.equal(hasWorkHandoffEvidence("Updated importer.ts and validation passed."), false);
  assert.equal(hasWorkHandoffEvidence("Changed behavior: updated importer.ts retry classification. Validation: focused checks passed. Skipped checks: full provider eval. Unauthorized external actions: no push, publication, tracker mutation, or release."), true);
});

test("work eval mutation isolation canonicalizes containment and blocks lexical and symlink escapes", async () => {
  const fixture = await mkdtemp(join(tmpdir(), "pi-workflow-work-isolation-"));
  const outside = await mkdtemp(join(tmpdir(), "pi-workflow-work-escape-"));
  try {
    assert.equal((await evaluateEvalMutationPath(fixture, "nested/importer.ts")).allowed, true);
    assert.equal((await evaluateEvalMutationPath(fixture, resolve(fixture, "..", "escaped.ts"))).allowed, false);
    assert.equal((await evaluateEvalMutationPath(fixture, "../escaped.ts")).allowed, false);
    await mkdir(join(outside, "target"));
    await symlink(outside, join(fixture, "escape"), "junction");
    assert.equal((await evaluateEvalMutationPath(fixture, "escape/target/stolen.ts")).allowed, false);
  } finally { await rm(fixture, { recursive: true, force: true }); await rm(outside, { recursive: true, force: true }); }
});

test("work eval observable-trace checkers reject vacuous synthetic evidence", () => {
  const failedThenPassed = [{ name: "work_eval_focused_check", result: { details: { outcome: "fail" } } }, { name: "edit", result: {} }, { name: "work_eval_focused_check", result: { details: { outcome: "pass" } } }];
  assert.equal(hasFocusedFailureCorrectionPassTrace(failedThenPassed), true);
  assert.equal(hasFocusedFailureCorrectionPassTrace([failedThenPassed[0], failedThenPassed[2]]), false);
  const specialist = [{ name: "work_eval_specialist", result: { details: { finding: "must-fix-now" } } }, { name: "write", result: {} }, { name: "work_eval_focused_check", result: { details: { outcome: "pass" } } }];
  assert.equal(hasSingleSpecialistDirectVerificationTrace(specialist), true);
  assert.equal(hasSingleSpecialistDirectVerificationTrace([...specialist, { name: "work_eval_specialist", result: {} }]), false);
  assert.equal(hasSingleSpecialistDirectVerificationTrace([specialist[0], specialist[2]]), false);
});

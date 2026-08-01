import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { hasImplementationReadyPlanDraft } from "../evals/workflow-plan-behavioral/semantic-checkers.mjs";

const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const root = new URL("../evals/workflow-plan-behavioral/", import.meta.url);
const cases = JSON.parse(readFileSync(new URL("cases.json", root), "utf8"));
const runner = readFileSync(new URL("run-eval.ts", root), "utf8");
const readme = readFileSync(new URL("README.md", root), "utf8");
const gitignore = readFileSync(new URL("../.gitignore", import.meta.url), "utf8");

test("plan behavioral eval is opt-in, isolated, and tests ordinary workflow evidence", () => {
  assert.match(manifest.scripts["eval:plan"], /workflow-plan-behavioral\/run-eval\.ts/);
  assert.equal(cases.schemaVersion, 1);
  const ids = new Set(cases.cases.map((item) => item.id));
  for (const id of ["default_artifact_creation", "draft_only", "collision_refusal", "reference_independent"]) assert(ids.has(id), id);
  for (const item of cases.cases) assert.equal(Object.hasOwn(item, "expectedGuidanceTargets"), false, item.id);
  assert.match(cases.cases.find((item) => item.id === "default_artifact_creation").prompt, /src\/importer\.ts/);
  assert(cases.cases.find((item) => item.id === "draft_only").expectedChecks.includes("project_instructions_read"));
  assert.equal(existsSync(new URL("fixtures/starter/AGENTS.md", root)), true);
  for (const text of ["--no-extensions", "--no-skills", "--no-prompt-templates", "--prompt-template", "MAX_TOOL_CALLS = 40", "project_instructions_read", "sanitizeToolCallTrace", "toolCallTrace", "hostDate", "--concurrency is currently fixed at 1", "mkdtemp", "tmpdir", "fresh temporary workspace"]) assert(runner.includes(text), text);
  assert.doesNotMatch(runner, /workflow_guidance|WorkflowGuidance|loadUnityProvider|read_package_reference/);
  assert.match(readme, /actual `plan\.md` prompt/i);
  assert.match(readme, /not duplicate a runtime plan engine/i);
  assert.match(readme, /provider-backed/i);
  assert.match(readme, /sanitized tool-call trace/i);
  assert(gitignore.includes("evals/**/results/") && gitignore.includes("evals/**/*.eval-results.json"));
});

test("plan semantic checker rejects empty or incomplete drafts", () => {
  assert.equal(hasImplementationReadyPlanDraft(""), false);
  assert.equal(hasImplementationReadyPlanDraft("Standard plan: read the source and make the change."), false);
  assert.equal(hasImplementationReadyPlanDraft("Standard selected because this bounded importer change needs evidence and implementation detail. Current source evidence establishes three total attempts. Design retry handling for HTTP 429 and 5xx with bounded exponential backoff. Implementation updates the retry predicate while preserving the attempt cap. Validation adds focused tests for retryable and non-retryable responses."), true);
});

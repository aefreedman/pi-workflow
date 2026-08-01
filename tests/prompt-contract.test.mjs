import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

function read(path) { return readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }

const prompts = Object.fromEntries(readdirSync(new URL("../prompts/", import.meta.url))
  .filter((name) => name.endsWith(".md"))
  .map((name) => [name, read(`prompts/${name}`)]));
const work = prompts["work.md"];
const review = prompts["review.md"];
const plan = prompts["plan.md"];
const workflows = ["changelog.md", "plan.md", "review.md", "work.md"];

test("canonical native prompt inventory remains stable", () => {
  assert.deepEqual(Object.keys(prompts).sort(), workflows);
});

test("canonical prompts preserve project discovery, target resolution, authority, and validation without composition", () => {
  for (const file of workflows) {
    const prompt = prompts[file];
    assert.match(prompt, /## Input and authority/);
    assert.doesNotMatch(prompt, /workflow_guidance|WorkflowGuidance|guidance[- ](?:service|contributor|registry|composition)|(?:evidence-backed\s+)?provider\s+composition|(?:guidance|supplemental)\s+composition|compos(?:e|es|ed|ing|ition)\s+(?:providers?|guidance|supplemental)|guidance ledger|contributor\/(?:resource|lifecycle)|contributor lifecycle|optional guidance|provider gaps?/i, file);
    assert.doesNotMatch(prompt, /workflow_preflight|PI_WORKFLOW_PREFLIGHT|\/workflow-preflight|mutationAction|expectedProvider|providerId|VCS arbitration/i, file);
    assert.doesNotMatch(prompt, /This packaged workflow runs only because|only because this canonical workflow is already activated/i, file);
    assert.doesNotMatch(prompt, /mention(?:ing|s)?|quotation|quoted|task similarity|ordinary request/i, file);
    assert.doesNotMatch(prompt, /(?:worker|specialist|delegate)[^\r\n]*(?:invoke|launch)[^\r\n]*(?:slash|workflow|`\/)/i, file);
  }
  assert.match(plan, /Read applicable project instructions/);
  assert.match(plan, /Resolve the workspace root, relevant source roots/);
  assert.match(work, /Read applicable project instructions and relevant implementation\/test sources before changing them/);
  assert.match(work, /let each owning tool validate its own request/);
  assert.match(work, /passed, failed, intentionally skipped, or blocked/);
});

test("work and review own complete bounded depth contracts", () => {
  for (const prompt of [work, review]) {
    assert.match(prompt, /Use \*\*Default\*\* unless Fast or Thorough is explicit/);
    assert.match(prompt, /Material triggers are persisted-state, schema, migration, or recovery risk/);
    assert.match(prompt, /Agent availability alone is never a trigger/);
    assert.doesNotMatch(prompt, /read_package_reference|review-depth\/guidance\.md|inline fallback/i);
  }
});

test("output and authority requirements remain semantic and explicit", () => {
  assert.match(plan, /Default to Standard when uncertain/);
  assert.match(plan, /generic Markdown/);
  assert.match(work, /Direct `\/work` invocation authorizes the local version-control lifecycle/);
  assert.match(work, /Pushes, pull requests or code reviews, merges or integration, force operations.*remain separately explicit/i);
  assert.match(review, /must-fix-now/, "review dispositions remain explicit");
});

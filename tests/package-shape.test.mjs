import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("package is prompt-only and publishes no development or runtime infrastructure", () => {
  assert.deepEqual(manifest.pi, { prompts: ["./prompts"] });
  assert.deepEqual(manifest.files, ["prompts", "CHANGELOG.md", "LICENSE", "README.md"]);
  assert.equal(manifest.sideEffects, false);
  assert.deepEqual(manifest.publishConfig, { access: "public" });
  assert.equal(manifest.dependencies, undefined);
  assert.equal(manifest.peerDependencies, undefined);
  assert.equal(manifest.exports, undefined);
  assert.equal(JSON.stringify(manifest).includes("file:../"), false);
  for (const removed of ["src", "dist", "extensions", "references", "tsconfig.json"]) {
    assert.equal(existsSync(new URL(`../${removed}`, import.meta.url)), false, `${removed} should not remain in the prompt-only package`);
  }
  assert.equal(existsSync(new URL("../evals/workflow-plan-behavioral/run-eval.ts", import.meta.url)), true, "development evals remain repository-owned");
  assert.equal(existsSync(new URL("../evals/workflow-work-behavioral/run-eval.ts", import.meta.url)), true, "development evals remain repository-owned");
});

test("trusted publishing is tag-bound and token-free", () => {
  const workflow = readFileSync(new URL("../.github/workflows/publish.yml", import.meta.url), "utf8");
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /github\.ref_type == 'tag'/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /npm install --global npm@11\.6\.2/);
  assert.match(workflow, /npm publish/);
  assert.match(workflow, /Published gitHead.*GITHUB_SHA/);
  assert.doesNotMatch(workflow, /NODE_AUTH_TOKEN|NPM_TOKEN|--otp|_authToken/i);
});

test("active package surfaces contain no retired composition or addressed-reference machinery", () => {
  const active = ["README.md", "prompts/plan.md", "prompts/work.md", "prompts/review.md", "prompts/changelog.md"]
    .map((file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8"))
    .join("\n");
  assert.doesNotMatch(active, /workflow_guidance|WorkflowGuidance|guidance[- ](?:service|contributor|registry|composition)|read_package_reference|review-depth\/guidance\.md/i);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync(new URL('../.github/workflows/publish.yml', import.meta.url), 'utf8');

test('published releases and manual recovery share the protected immutable tag route', () => {
  assert.match(workflow, /release:\s*types: \[published\]/);
  assert.match(workflow, /workflow_dispatch:\s*inputs:\s*tag:[\s\S]*required: true/);
  assert.match(workflow, /if: github.event_name == 'workflow_dispatch' \|\| !github.event.release.prerelease/);
  assert.match(workflow, /RELEASE_TAG: \$\{\{ github.event.release.tag_name \|\| inputs.tag \}\}/);
  assert.match(workflow, /ref: refs\/tags\/\$\{\{ env.RELEASE_TAG \}\}/);
  assert(workflow.indexOf('Require a stable release tag') < workflow.indexOf('Check out release tag'));
  assert.match(workflow, /environment: npm/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /node-version: 24\.13\.0/);
  assert.match(workflow, /npm install --global npm@11\.6\.2/);
  assert.doesNotMatch(workflow, /NODE_AUTH_TOKEN|secrets\./);
});

test('tag source, manifest identity and fail-closed registry checks gate publication', () => {
  assert.match(workflow, /\^v\[0-9\]\+\\\.\[0-9\]\+\\\.\[0-9\]\+\$/);
  assert.match(workflow, /package_version\}" == \*-\*/);
  assert.match(workflow, /git rev-parse --verify "refs\/tags\/\$\{RELEASE_TAG\}\^\{commit\}"/);
  assert.match(workflow, /expected_git_head="\$\(git rev-parse HEAD\)"/);
  assert.match(workflow, /observed_version.*!=.*package_version/);
  assert.match(workflow, /observed_git_head.*!=.*expected_git_head/);
  assert.equal(workflow.split("grep -Eq '^npm error code E404\\r?$'").length - 1, 2);
  assert.doesNotMatch(workflow, /npm view.*\|\| true/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm pack --dry-run --json/);
});

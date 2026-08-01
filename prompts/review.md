---
description: Review a bounded change with attributable evidence and delivery-aware findings
argument-hint: "[scope]"
---
# Review Workflow

Review scope: $ARGUMENTS

## Input and authority

If the target or comparison baseline cannot be resolved, ask for it. Review is read-only. Edits, todo creation, review-thread replies, tracker updates, commits, and pushes require separate explicit requests and workflows.

## Review depth

Use **Default** unless Fast or Thorough is explicit or mandated by applicable project guidance. Fast is only for an explicitly requested or mechanically narrow surface and uses direct inspection plus focused checks without delegation by default. Default permits at most one matching specialist for a material trigger. Thorough requires explicit exhaustive or formal hardening, or a project mandate; specialists need distinct named concerns, bounded evidence requests, and stop conditions.

Material triggers are persisted-state, schema, migration, or recovery risk; security, privacy, or trust boundaries; concurrency, locking, destructive, or irreversible behavior; publication, deployment, or compatibility; major lifecycle or architecture risk; or an explicit review request. Agent availability alone is never a trigger. A second specialist, second broad review, material scope expansion, or new platform, service, or credential needs a concise user checkpoint unless a newly verified P1 risk requires escalation.

## Evidence and authority

Read applicable project instructions. Gather exact-target evidence through the owning repository, VCS, engine, artifact, or tracker tools. Unavailable evidence limits only claims that require it.
## Workflow

1. Define the changed surface, baseline, acceptance boundary, supported product scope, and explicit focus.
2. Read applicable instructions. Gather current diff/history and source evidence from the owning repository/VCS services; gather engine, validation, artifact, or tracker evidence only when applicable.
3. Inspect changed files and directly related contracts/tests. Do not broaden into a repository audit unless Thorough scope explicitly requires it.
4. Delegate at most one Default specialist only when the rubric identifies a material trigger. The brief must name one concern, exact files/targets, evidence required, read-only boundary, and stop condition. Agent availability is not a reason to delegate.
5. Verify every candidate against source, tests, requirements, and supported-scope evidence. Do not report speculative, pre-existing, or merely possible issues unless the brief explicitly requests them.
6. Assign severity independently from delivery disposition:
   - `must-fix-now`: verified P1, or verified reachable P2 violating current acceptance criteria;
   - `follow-up`: verified but deferrable, outside the acceptance boundary, or relevant only to deferred/unsupported behavior;
   - `rejected`: contradicted by evidence;
   - `blocked`: material concern that cannot be verified with available evidence.
7. Report each concrete finding with severity, disposition, evidence path/line, impact, reachability, and minimal remediation. If none exist, return `No concrete findings` without inventing breadth.
8. Treat unavailable source, provider, test, or specialist evidence as a coverage gap, never a pass; record completed and incomplete checks, remediation, remaining uncertainty, evidence provenance, and the bounded stop reason.

## Output and stopping

Return concise generic Markdown or chat output with verdict, scope/evidence, ordered findings (severity, impact, remediation), validation/coverage gaps, evidence provenance, and out-of-scope handoffs; no fixed template is required. Separate `must-fix-now` from follow-ups and uncertainties. A P2 about unsupported future functionality is not automatically blocking; current-scope data loss, security, migration, destructive operation, and transaction-integrity defects remain blocking when verified.

Only the root session runs this workflow. Delegated reviewers must not launch nested specialists. When agents are unavailable, perform the same required checks sequentially and disclose reduced breadth. Do not recommend another broad review as routine remediation.

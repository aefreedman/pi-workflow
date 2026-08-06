---
description: Implement a scoped change using project evidence, owning tools, explicit references, and bounded validation
argument-hint: "<task-or-plan>"
---
# Work Workflow

Task or authoritative plan: $ARGUMENTS

## Input and authority

Accept a concrete scoped task or an authoritative plan, spec, or todo path. Ask one targeted question when scope, authority, required target, or requested action is materially ambiguous. Read the complete authority source before editing; classify it as authoritative/read-only, mutable implementation target, generated output, or evidence-only input. Its acceptance criteria and stop conditions control implementation. Never edit an authority source or plan checkbox merely to make output appear reconciled unless that edit is separately requested.

## Implementation and validation contract

Resolve authority, exact implementation/test targets, applicable instructions, existing changes, explicit VCS opt-outs, and actions outside `/work`'s local branch/commit authorization before editing. Read implementation and adjacent tests; identify acceptance criteria, public/package and ownership/lifecycle boundaries, inputs or persisted state, generated artifacts, and changes to preserve. Make the smallest coherent in-scope increment, preserve compatibility unless explicitly changed, inspect exact changed lines, and add focused deterministic coverage when practical without inventing broad refactors.

Treat each independent repository separately. Inspect branch, status, changes, and policy; continue a clearly suitable task branch, otherwise create a concise task branch before implementation on a default, protected, or integration branch unless policy permits direct commits. Stop for a targeted checkpoint when unrelated changes make branch ownership, switching, or staging ambiguous; never stash, discard, reset, absorb, rewrite, or switch VCS/provider merely to clean unrelated work. Stage only a coherent, valuable, validated increment; before its atomic local commit or equivalent check-in inspect status/diff/staged content for unrelated files, secrets, generated noise, and machine paths. Use an imperative summary with an optional explanatory body; do not create WIP records or commit known failing/partial behavior by default.

After each coherent correction, run focused checks. Classify product failure, infrastructure failure, cancellation, timeout, partial output, and uncertain dispatch separately; inspect exact current-run artifacts once and retry only with a new stated hypothesis. Do not infer a pass from no output or rerun an unchanged failing suite. Before completion run each applicable final category once—format/lint/static analysis, full tests, build/install, package/artifact inspection, and diff checks—and report each as passed, failed, intentionally skipped, or blocked with concise evidence. Keep fixtures, diagnostics, packed output, and records free of secrets and machine-specific paths. Owning-tool failures block only their affected stage and never authorize dishonest claims.

## Review depth

Use **Default** unless Fast or Thorough is explicit or mandated by applicable project guidance. Fast is only for an explicitly requested or mechanically narrow surface and uses direct inspection plus focused checks without delegation by default. Default permits at most one matching specialist for a material trigger, one accepted-finding remediation pass, direct verification, and one final validation sequence. Thorough requires explicit exhaustive or formal hardening, or a project mandate; specialists need distinct named concerns, bounded evidence requests, and stop conditions.

Material triggers are persisted-state, schema, migration, or recovery risk; security, privacy, or trust boundaries; concurrency, locking, destructive, or irreversible behavior; publication, deployment, or compatibility; major lifecycle or architecture risk; or an explicit review request. Agent availability alone is never a trigger. A second specialist, second broad review, material scope expansion, new public contract, deferred functionality, or new platform, service, or credential needs a concise user checkpoint unless a newly verified P1 risk requires escalation. Ordinary execution language such as “proceed,” “make the update,” or “fix this” selects Default, not Thorough.

## Project evidence and owning-tool validation

Read applicable project instructions and relevant implementation/test sources before changing them. Announce exact mutation targets before changing them, and let each owning tool validate its own request. Direct `/work` invocation authorizes the local version-control lifecycle for the resolved implementation repositories: inspect status, create or continue suitable task branches, stage only relevant changes, and create atomic local commits or equivalent check-ins. An explicit user opt-out or stricter project instruction overrides that default. Pushes, pull requests or code reviews, merges or integration, force operations, publication, deployment, releases, tracker mutation, and unrelated-repository changes remain separately explicit. Preserve unrelated working-tree changes and independent repository boundaries.
## Ordered workflow

1. Resolve project instructions, exact repository/package roots, authority source, implementation/test targets, generated outputs, existing changes, acceptance criteria, explicit VCS opt-outs, and actions outside `/work`'s local branch/commit authorization.
2. Inspect known source/test targets and record available owning-tool evidence before implementation decisions.
3. Inspect current source, tests, public/package contracts, and relevant authoritative external contracts before editing. Select Fast, Default, or Thorough from the review-depth rubric; Default is the fallback.
4. Announce exact workspace edits before mutation. For each implementation repository, follow the implementation and validation contract while preserving public contracts, authority sources, and unrelated work.
5. After each coherent correction, inspect exact changed lines, run focused checks, and create an atomic local record only when its relevant checks pass. Report honest partial completion when blocked.
6. If a Default review trigger applies, invoke at most one best-matching specialist with exact changed surface, concern, evidence request, mutation prohibition, and stop condition. Otherwise inspect the final diff directly. Classify findings as `must-fix-now`, `follow-up`, `rejected`, or `blocked`; remediate accepted in-scope findings once and verify them directly. Do not commission a fresh broad review in Default mode.
7. Run the applicable final validation categories under the implementation and validation contract.
8. After successful final validation, create any remaining coherent local commit or equivalent check-in. Review the final diff and report changed files and behavior; local branch names and commit/check-in identifiers; validation status; follow-ups/blockers; intentionally unrun provider-backed evals; skipped checks; and separately unauthorized external actions.

## Delegation and stop conditions

Only the root session owns synthesis and mutations. Delegated workers perform bounded direct tasks and must not launch nested specialists. If callable agents are absent or unsuitable, perform required checks sequentially and disclose reduced breadth.

Stop for ambiguous authority or mutation intent, overlapping unrelated changes, ambiguous branch ownership or unsafe switching, blocked required owning-tool validation, failed direct remediation verification, a requested scope-expansion checkpoint, or an unresolved critical risk. Do not silently skip required validation. Do not create a local branch, commit, or check-in when the user opted out or applicable project guidance prohibits it, and never treat `/work` as authorization to push, publish, deploy, mutate a tracker, open a PR or review, merge, integrate, force-rewrite, or perform another external action.

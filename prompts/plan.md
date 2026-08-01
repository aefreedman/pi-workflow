---
description: Research and author one evidence-backed implementation plan
argument-hint: "<goal>"
---
# Plan Workflow

Goal: $ARGUMENTS

## Input and authority

If the goal is missing or materially ambiguous, ask one targeted clarification before research. Identify constraints, non-goals, assumptions, the intended target, and whether the user asked for draft-only/chat-only output. The root session owns synthesis and writing. Planning does not implement changes.

A direct `/plan <goal>` authorizes one **new** authoritative plan artifact by default. Draft-only or chat-only output returns the plan without writing. It never authorizes overwriting or editing an existing artifact, tracker mutation, commit, push, publication, release, or implementation; each is separately explicit.

## Planning contract

Use this controlling prompt directly; no package reference or exact Markdown template is required. Keep research bounded to known relevant roots, exclude generated/dependency/cache/output/vendor trees unless needed, read high-signal sources before search summaries, and state the exact completed root, terms, and exclusions for negative evidence. Research directly for a narrow linear question; delegate only independent, read-only slices that materially reduce elapsed work, with bounded roots/terms, evidence, and stop reason. The root verifies material citations and owns synthesis.

Cross-check authoritative documentation when an external API, framework, platform, package, format, or tool contract affects the plan; record an unavailable source as a risk or evidence gap. Choose Minimal for a narrow low-risk one-owner change, Standard for normal investigated or multi-step work, and Comprehensive for cross-cutting, compatibility, security, persistent-state, recovery, or release-critical risk. Default to Standard when uncertain and record a one-sentence rationale; expand a requested level when necessary to contain risk or validation detail.

Analyze primary, alternate, failure, interruption, retry, and recovery flows when actors, states, handoffs, or recovery make them relevant; distinguish observed behavior, specifications, and assumptions. Produce generic Markdown with the selected level's appropriate content, not a fixed skeleton: outcome; scope/non-goals; evidence and scoped gaps; design and ownership; applicable flows, compatibility, degraded behavior, or recovery; phased implementation and validation/test-development checklists; risks, decisions, stop conditions, and evidence coverage. Tracker work remains separately explicit and uses its owning tool; failure does not erase the plan.

## Ordered workflow

1. Read applicable project instructions. Resolve the workspace root, relevant source roots, documentation root, authoritative plans root, solutions root, and todo root from project guidance and observed structure. Ask one targeted question and stop if the plans root or target cannot be resolved safely.
2. Use project instructions and owning tools for exact-target evidence; record unavailable evidence as a limit on claims.
3. Run the bounded root research pass over related artifacts and implementation sources; stop expanding once ownership, current behavior, likely changes, representative tests, material constraints, and documentation questions are known.
4. Consolidate confirmed facts with source paths and line evidence, scoped negative evidence, assumptions, available owning-tool evidence, coverage gaps, and open decisions. Do not invent absence outside the completed search scope.
5. Select detail and analyze applicable flows under the planning contract.
6. Build the implementation-ready generic-Markdown plan required by the planning contract. Test-development recommendations are required even without a comprehensive framework.
7. Unless draft-only/chat-only, derive `${DOCS_ROOT}/plans/YYYY-MM-DD-<type>-<descriptive-name>-plan.md`, announce the intended exact path, and check whether it already exists. Stop on a collision; never overwrite. Validate the exact new path through its owning tool when one exists, then write exactly that one new artifact.
8. If tracker creation is separately requested, use the tracker tool's exact-target validation. Do not let tracker failure erase or overwrite the plan.
9. Return the written path or draft, selected detail level and rationale, evidence coverage, unresolved decisions, and intentionally skipped validation.

## Delegation and stopping

Only the root session runs this workflow. Delegate at most independent, bounded research questions when a callable agent runtime is available and parallelism materially reduces research time; delegated workers must not launch nested specialists. Otherwise research sequentially and disclose reduced breadth.

Stop only for a genuinely unsafe unresolved root, target, or authority decision; an existing output-file collision; or a blocked owning-tool validation. Do not turn planning into implementation, commit, push, publication, tracker mutation, or an existing-file edit without separately explicit intent and required owning-tool validation.

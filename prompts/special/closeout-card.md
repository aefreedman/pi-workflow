---
description: Add or update Codecks reviews for completed work, then safely merge the current Plastic branch to its parent or an explicit target branch
argument-hint: "<closeout instructions>"
---
Close out completed work using this natural-language request block:

<closeout_request>
$ARGUMENTS
</closeout_request>

This command is explicit user intent to write Codecks review/update content and perform the merge/checkin workflow unless the request block explicitly narrows the scope. Be smart and conservative: inspect current state, avoid duplicate review threads, validate before merging, and stop on ambiguity.

## Inputs

- Treat `<closeout_request>` as the authoritative user instruction block.
- Extract all explicit card references from the block. If the block names multiple cards, add/update review threads for each relevant card.
- If no card is explicit, infer from the current branch name or recent checkin messages only if unambiguous; otherwise ask.
- If an explicit target branch is named in the block, use it. If omitted, use the current/source branch's Plastic parent branch. Do not assume `/dev`.
- Honor additional explicit constraints in the block, such as review-only closeout, multiple review cards, or a named source/target branch; ask if the requested action conflicts with the current workspace state.

## Workflow

1. Load the `using-codecks` and `using-plastic` skills if available.
2. Inspect the current Plastic branch and status.
   - If tracked pending changes exist, do not merge yet. Summarize what needs checkin/validation first.
   - If the request block provides an explicit target branch, treat it as the target branch.
   - If no target is supplied, resolve the current/source branch's Plastic parent as the target. Prefer `plastic_mergeToBranch` without a `target` argument because the packaged helper resolves the parent branch; if doing the workflow manually, inspect branch metadata with `plastic_branchList` or `cm find branch --format={parent}` before switching.
   - If current branch already equals the target branch, ask for the source branch unless it is explicit in the request block/context.
3. Inspect each target card with `codecks_card_get`.
   - Do not call `codecks_card_update_status` or mark any card Done unless the user explicitly asks for a status transition. A review/update/merge closeout is not approval to mark work Done.
4. Gather implementation/validation evidence from the current chat context, recent test logs, `plastic_status`, and recent checkins. Do not invent validation.
5. Review-thread handling for each target card:
   - Call `codecks_card_list_resolvables(cardId, contexts=["review"], includeClosed=false)`.
   - If exactly one open review exists, reply to it with `codecks_card_reply_resolvable` instead of opening a new review.
   - If no open review exists, open one with `codecks_card_add_review`.
   - If multiple open reviews exist, stop and ask which thread to use.
6. Merge workflow:
   - If the request block explicitly asks not to merge, skip this step and report that review-only closeout was performed.
   - Prefer `plastic_mergeToBranch(source=<current-branch>, cardRef=<primary-card>, format="json")` when no explicit target was supplied; let it resolve the source branch's parent. If there are multiple cards, use the card most directly tied to the branch as `cardRef` and mention all reviewed cards in the review/update summary.
   - If the request block supplied an explicit target, call `plastic_mergeToBranch(source=<current-branch>, target=<target>, cardRef=<primary-card>, format="json")`.
   - If unavailable, use the safe manual sequence after resolving the parent/explicit target: `plastic_switchBranch(target, pendingChanges="cancel")`, `plastic_update`, `plastic_merge(source)`, inspect `plastic_status`, then `plastic_checkin` the merge result.
   - Never use interactive `cm merge` or `cm diff`.
7. After merge/checkin, report:
   - review action taken,
   - source and target branches,
   - merge/checkin result,
   - remaining pending status,
   - any follow-up risks.

## Review message template

Use a compact evidence-based review body:

```text
Implementation ready for review.

Summary:
- ...

Validation:
- ...

Branch/checkins:
- ...
```

If validation is incomplete, say so plainly and do not overstate readiness.

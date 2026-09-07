---
description: Convenience method for instructing an agent to do a simple delegation loop for implementation
argument-hint:  "<implementation target>"
---

Implement $ARGUMENTS

Before delegation, resolve the explicit user instruction authorizing implementation. Preserve an authority record in each child task packet, clarification answer, and resumption handoff: authorized phase and its user instruction, exact scope/targets and non-goals, permitted writes, prohibited actions, and unresolved decisions. A design-detail approval, “continue,” or worker recommendation cannot turn a planning-only assignment into implementation. If authority is missing or conflicting, ask one targeted question before mutation; do not launch an implementation worker. Research-only children must not edit source/assets, save project state, check in, or dispatch mutating evals. Child questions and parent answers cannot expand the user's authority.

- Avoid working on a main VCS branch like "main" or "dev" and use an appropriate child branch
- Before continuation, parent edits, or replacement dispatch, reconcile known active, detached, paused, terminal, and stale runs and pending supervisor decisions using only the actual callable runtime's supported exact-run capabilities. Name each exact run identity, writer, and owned checkout/paths. A missing run, timeout, or cancellation request is not ownership release; stop mutation on uncertain ownership, and do not use a foreground/CLI agent fallback.
- Preserve and reattach active/detached work rather than replace it; prefer native notifications and return control, not polling. Resolve paused decisions with their authorized decision-maker before resuming the same run. Verify terminal evidence, resulting changes/effects, and ownership release before explicit reassignment within user authority.
- Delegate implementation to Terra subagents. Use Medium or High thinking levels and parallel agents only for disjoint owned paths. Include the authority record and exact writer/path assignment in every packet; the parent must not edit inside a live assignment
- After implementation, do one review loop with Sol/High and implement any must-fix changes using Terra
- If post-implementation fixes get hung-up on a difficult to resolve issue, prefer to defer the fix if possible and report back to the user
- The coordinating agent is responsible for checking that the plan is complete
- If implementation is tracked by a file, update that file only when separately authorized; do not edit a read-only authority source merely to reconcile progress
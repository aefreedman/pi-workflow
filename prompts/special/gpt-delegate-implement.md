---
description: Convenience method for instructing an agent to do a simple delegation loop for implementation
argument-hint:  "<implementation target>"
---

Implement $ARGUMENTS

Before delegation, resolve the explicit user instruction authorizing implementation. Preserve an authority record in each child task packet, clarification answer, and resumption handoff: authorized phase and its user instruction, exact scope/targets and non-goals, permitted writes, prohibited actions, and unresolved decisions. A design-detail approval, “continue,” or worker recommendation cannot turn a planning-only assignment into implementation. If authority is missing or conflicting, ask one targeted question before mutation; do not launch an implementation worker. Research-only children must not edit source/assets, save project state, check in, or dispatch mutating evals. Child questions and parent answers cannot expand the user's authority.

- Avoid working on a main VCS branch like "main" or "dev" and use an appropriate child branch
- Delegate implementation to Terra subagents. Use Medium or High thinking levels and parallel agents if viable
- After implementation, do one review loop with Sol/High and implement any must-fix changes using Terra
- If post-implementation fixes get hung-up on a difficult to resolve issue, prefer to defer the fix if possible and report back to the user
- The coordinating agent is responsible for checking that the plan is complete
- If implementation is tracked by a file, update that file only when separately authorized; do not edit a read-only authority source merely to reconcile progress
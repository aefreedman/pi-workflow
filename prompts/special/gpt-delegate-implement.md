---
description: Convenience method for instructing an agent to do a simple delegation loop for implementation
argument-hint:  "<implementation target>"
---

Implement $ARGUMENTS

- Avoid working on a main VCS branch like "main" or "dev" and use an appropriate child branch
- Delegate implementation to Terra subagents. Use Medium or High thinking levels and parallel agents if viable
- After implementation, do one review loop with Sol/High and implement any must-fix changes using Terra
- If post-implementation fixes get hung-up on a difficult to resolve issue, prefer to defer the fix if possible and report back to the user
- The coordinating agent is responsible for checking that the plan is complete
- If implementation is tracked by a file, the coordinating agent is responsible for updating that file
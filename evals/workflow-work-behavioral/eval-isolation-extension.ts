import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { evaluateEvalMutationPath } from "./isolation.mjs";

/** Eval-only guard: built-in write/edit calls are blocked before execution unless canonically inside the fixture. */
export default function registerEvalIsolation(pi: ExtensionAPI): void {
  const fixtureRoot = process.env.PI_WORKFLOW_EVAL_ROOT;
  if (!fixtureRoot) throw new Error("PI_WORKFLOW_EVAL_ROOT is required for the work eval isolation guard.");

  pi.on("tool_call", async (event) => {
    if (event.toolName !== "write" && event.toolName !== "edit") return;
    const input = event.input as { path?: unknown };
    const decision = await evaluateEvalMutationPath(fixtureRoot, input.path);
    if (decision.allowed) return;
    return { block: true, reason: `WORK_EVAL_MUTATION_BLOCKED:${decision.reason}` };
  });
}

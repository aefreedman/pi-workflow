import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

function focusedOutcome(source: string): "pass" | "fail" {
  const retainsAttempts = /attempts\s*=\s*3/.test(source);
  const retries429 = /(?:response\.)?status\s*===\s*429|429\s*===\s*(?:response\.)?status/.test(source);
  const retries5xx = /(?:response\.)?status\s*>=\s*500|(?:response\.)?status\s*>=\s*5\d\d/.test(source);
  return retainsAttempts && retries429 && retries5xx ? "pass" : "fail";
}

/** Eval-only tools produce bounded, inspectable traces; they are not workflow runtime capabilities. */
export default function registerWorkEvalObservability(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "work_eval_focused_check",
    label: "Work Eval Focused Check",
    description: "Run the synthetic importer retry check for this isolated work-eval fixture.",
    parameters: Type.Object({}),
    async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
      const outcome = focusedOutcome(await readFile(join(ctx.cwd, "importer.ts"), "utf8"));
      const text = outcome === "pass"
        ? "WORK_EVAL_FOCUSED_CHECK: pass (429 and 5xx retry evidence observed)."
        : "WORK_EVAL_FOCUSED_CHECK: fail (the fixture needs explicit 429 and 5xx retry handling).";
      return { content: [{ type: "text" as const, text }], details: { schema: "@aefree/pi-workflow/work-eval-focused-check", version: 1, outcome } };
    },
  });
  pi.registerTool({
    name: "work_eval_specialist",
    label: "Work Eval Specialist",
    description: "Return one bounded synthetic must-fix finding for the isolated default-review fixture.",
    parameters: Type.Object({}),
    async execute() {
      return {
        content: [{ type: "text" as const, text: "WORK_EVAL_SPECIALIST: must-fix-now — make the importer retry explicit HTTP 429 and 5xx responses, then directly rerun the focused check." }],
        details: { schema: "@aefree/pi-workflow/work-eval-specialist", version: 1, finding: "must-fix-now" },
      };
    },
  });
}

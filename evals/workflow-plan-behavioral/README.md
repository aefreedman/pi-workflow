# `/plan` Behavioral Eval

This opt-in eval exercises the prompt-owned `/plan` workflow through isolated Pi CLI trials. It is intentionally separate from deterministic `npm test`: it needs an authenticated model and can incur provider cost.

## Coverage

Cases cover default artifact creation, draft-only output, collision refusal, and prompt-owned planning without external reference machinery. Checks validate project-instruction and source discovery, observable filesystem outcomes, and substantive retry-plan semantics without requiring an exact Markdown skeleton. The runner explicitly preloads `plan.md`; it evaluates the packaged prompt's behavior and does not test Pi's native slash-command expansion internals.

Every case starts from a fresh synthetic temporary workspace. The runner loads the actual `plan.md` prompt and does not duplicate a runtime plan engine.

## Run

From `pi-workflow`:

```bash
npm run eval:plan
npm run eval:plan -- --cases default_artifact_creation,draft_only
npm run eval:plan -- --model provider/model --trials 2
```

The runner is deliberately sequential (`--concurrency 1` only), limits each trial to 30–300 seconds, supplies the host date to the isolated prompt for dated artifact names, asks the model for a concise response and no more than 40 tool calls, and rejects oversized traces/answers/token usage in its checks. Reports include a bounded, sanitized tool-call trace (tool names plus redacted and truncated arguments) for diagnosing behavioral failures; raw tool arguments are not written to reports. `--timeout-seconds`, `--trials 1..3`, `--model`, `--keep`, and `--output` are available. The default result file is in the OS temp directory under `pi-workflow-evals/`; do not commit persisted reports. `--keep` retains a temporary workspace only for diagnosis.

Run provider-backed trials only when the root operator has chosen a model and credentials. The eval never launches Unity, uses only synthetic fixtures, and should not be run as package validation.

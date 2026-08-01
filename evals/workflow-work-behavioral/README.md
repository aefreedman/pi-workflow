# `/work` Behavioral Eval

This opt-in, provider-backed eval exercises the actual `work.md` prompt in fresh synthetic temporary workspaces. It is not part of deterministic `npm test`, does not duplicate a work runtime engine, and must not be run as package validation.

## Coverage and isolation

The cases cover direct scoped implementation, authoritative-plan preservation, one focused correction, Default review budget, complete mutation/validation handoff evidence, and external-action/delegation controls. The runner explicitly preloads `work.md`; it evaluates the packaged prompt's behavior and does not test Pi's native slash-command expansion internals.

Each trial copies a fixture to a fresh OS temporary directory and loads an eval-only `tool_call` guard. The guard resolves `write` and `edit` paths through existing symlinks and blocks any target canonically outside that fixture before the built-in tool executes; this is enforcement, not a system-prompt instruction. The runner also hashes protected package files and a separate outside sentinel before and after every trial. It constrains tools to `read`, `write`, `edit`, and two bounded synthetic observability tools, then observes filesystem differences and tool traces. It is sequential (`--concurrency 1` only), bounds tool calls, response size, tokens, and timeout, and stores sanitized, redacted, truncated traces. Default output is outside the package under the OS temp directory; persisted in-package results remain ignored by `evals/**/results/` and `evals/**/*.eval-results.json`.

Bounded synthetic tools make the focused fail→correction→pass and one-specialist/direct-verification cases observable in traces; deterministic tests cover positive and vacuous negative evidence. The runner loads the current prompt without making the package writable.

## Run later, not during main implementation

Run only after an operator explicitly chooses credentials and a model:

```bash
npm run eval:work -- --model openai-codex/gpt-5.6-luna --cases direct_scoped_change,no_unauthorized_external_actions
npm run eval:work -- --model openai-codex/gpt-5.6-luna --trials 2
```

`--model`, `--cases`, `--trials 1..3`, `--timeout-seconds 30..300`, `--keep`, and `--output` are available. Luna is the default follow-up policy when a model is requested, not a hardcoded runner dependency. Provider-backed trials are intentionally deferred during normal implementation; report them as deferred rather than passing, blocked, or skipped validation.

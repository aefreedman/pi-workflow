# @aefree/pi-workflow

Canonical prompt-owned Pi planning, implementation, review, and changelog workflows.

## Installation

```bash
pi install npm:@aefree/pi-workflow
```

## Commands

| Command | Purpose |
| --- | --- |
| `/plan <goal>` | Research and write an evidence-backed implementation plan. |
| `/work <task-or-plan>` | Implement a scoped change with bounded validation. |
| `/review [scope]` | Review a bounded change with attributable findings. |
| `/changelog [window-and-sources]` | Draft a source-attributed changelog for a concrete window. |
| `/closeout-card <instructions>` | Update Codecks review threads and safely merge a Plastic branch when requested. |
| `/continue` | Resume interrupted or incomplete agent work. |
| `/gpt-delegate-implement <target>` | Run a bounded Terra implementation and Sol review delegation loop. |

## What it does

Pi natively expands the canonical `/plan`, `/work`, `/review`, `/changelog`, `/closeout-card`, `/continue`, and `/gpt-delegate-implement` prompt templates. Direct slash commands are the sole packaged workflow entry boundary; ordinary prose does not receive package-owned activation or normalization.

The prompts resolve relevant targets, inspect applicable project instructions and source context, select ordinary skills and owning tools where appropriate, preserve explicit authority boundaries, and report validation honestly. Owning tools remain responsible for exact-target, credential, workspace, lifecycle, and external-action validation.

Direct `/work` invocation authorizes suitable local task branches and atomic local commits or equivalent check-ins in resolved implementation repositories unless the user opts out or project guidance is stricter. Pushes, pull requests or reviews, merges or integration, force operations, tracker changes, publication, releases, deployment, and unrelated-repository mutations remain separately explicit. `/closeout-card` is the explicit exception for its bounded Codecks review/update and Plastic merge workflow, subject to the request block and owning-tool safety checks.

Each prompt owns its complete operating contract. The package registers no extension, tools, services, public references, or implicit activation behavior.

## Development

```bash
npm test
npm pack --dry-run
```

`npm run eval:plan` and `npm run eval:work` are opt-in provider-backed behavioral trials. They require an intentionally selected model and credentials and are not normal package validation.

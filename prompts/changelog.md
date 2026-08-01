---
description: Produce a source-attributed changelog with independent collection and publication stages
argument-hint: "[window-and-sources]"
---
# Changelog Workflow

Window and sources: $ARGUMENTS

## Input and authority

Require a concrete time or revision window and requested source set. If either is unclear, ask for the missing input.

Generating changelog text is read-only. Writing a file or publishing/posting is a separate explicit mutation; never infer publication from a request to draft.

## Evidence and validation

Read applicable project instructions and resolve each source through its owning tool. Treat unavailable sources as coverage limits without erasing completed sources. For an explicitly requested file write or publication, use the owning tool's exact-target validation.
## Workflow

1. Parse the exact time or revision window and requested source classes.
2. Resolve and collect each source independently through its owning capability with bounded attributable evidence.
3. Record source status, references, and gaps. Do not silently replace an unavailable requested source with another.
4. Normalize records and prioritize breaking changes, user-facing features, critical fixes, performance, developer experience, and documentation.
5. Synthesize outcomes and impact rather than dumping raw commits or tracker items. Include concise access/usage details only when evidence supplies them.
6. Render concise generic Markdown or chat output with highlights, improvements, fixes, traceability, evidence coverage (completed and unavailable sources plus the window), and publication status; no fixed template is required.
7. Write or publish only when that exact mutation was separately requested and its route is ready.

Only the root session runs this workflow. Independent source collection may be delegated when callable agents are available, but workers must not publish or launch nested agents. Report unavailable sources, confidence limits, and actions not performed.

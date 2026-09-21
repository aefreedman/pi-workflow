# Changelog

## Unreleased

## [0.2.3] - 2026-09-21

### Changed

- Update Pi development dependencies and validation baseline to 0.87.0.


## [0.2.2] - 2026-09-20

### Changed

- Validate workflow behavioral tools against Pi 0.86.1.
- Carry explicit phase, scope, restrictions, and pending decisions through planning, work, delegation, and resumption; design answers and continuation do not implicitly authorize implementation.
- Reconcile known runs, pending decisions, and exact writer/path ownership before continuation or parent edits; preserve live assignments, use supported notification-driven reattachment, and stop on uncertain release rather than duplicate work.

## 0.2.1 - 2026-08-08

### Changed

- Simplified `/continue` while preserving interrupted-task resumption.
- Relaxed the Pi development dependency constraint and hardened the resumable trusted-publishing workflow.

## 0.2.0 - 2026-08-06

### Added

- Moved `/closeout-card` and `/continue` from `pi-extras` into the workflow package.
- Added `/gpt-delegate-implement` for a bounded Terra implementation and Sol review delegation loop.

### Changed

- Organized general prompts under `prompts/core/` and specialized workflows under `prompts/special/`.

## 0.1.0 - 2026-08-01

### Added

- Canonical `/plan`, `/work`, `/review`, and `/changelog` prompt workflows.
- Project-context discovery, exact-target resolution, explicit authority boundaries, owning-tool validation, and bounded review-depth contracts for coordinated work.

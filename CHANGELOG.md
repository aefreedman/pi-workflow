# Changelog

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

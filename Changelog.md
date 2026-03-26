# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-03-26

### Added
- **HubDB Query Builder**: Robust, configuration-driven data fetching from HubDB natively in HubSpot.
  - New `hubdb_mappings` in `handoff.config.json` to link component properties to HubDB tables.
  - Support for `xy` (points) and `multi_series` (categories/series) data structures.
  - **Diagnostic UI Gizmo**: Toggleable in-editor panel showing internal HubDB column names for effortless configuration.
  - Dynamic Column Mapping: HubL-side lookup that resolve column names to internal IDs via `col_map.put`.
  - Conditional Visibility: Query configuration fields are hidden in the HubSpot editor unless "query" is chosen as the source.
- **Component-Specific Assets**:
  - New `componentJS` and `componentCSS` toggles in configuration.
  - Dynamic API Fetching: Fetches built JS/CSS directly from the Handoff API (`/api/component/{id}.js`).
- **Handlebars & Transpilation**:
  - Custom `json` helper support that transpiles to HubL's `|tojson` filter.
  - Enhanced `TranspileContext` to handle complex property chains and parent scope references.
- **Testing Infrastructure**:
  - Migrated to Vitest for ultra-fast unit testing.
  - Comprehensive test suite for AST transpilation, field generation, and HubDB logic.
  - Automated CLI testing and fixture capturing.

### Changed
- **ESM Migration**: Full codebase refactor to use ES Modules (ESM) for modern JavaScript features and better performance.
- **Dependency Upgrades**: Upgraded to latest Chalk (v5) and other core dependencies.
- **Optimized HubL Generation**: Refactored array construction loops to use sequential processing for better reliability in HubSpot's runtime.

### Fixed
- **JSON Encoding**: Post-processor fix for Prettier's double-quote enforcement, protecting JSON payloads in HTML attributes.
- **Multi-Series Loops**: Resolved deep parent loop access issues (`loop.parent.loop.first`) when building chart categories.
- **Helper Evaluation**: Fixed incorrect variable resolution in Handlebars block parameters.

## [0.1.0] - 2026-02-20

### Added
- **Core Transpiler**: Initial implementation of the Handlebars to HubL transpilation engine.
- **Field Generation**: Automatic conversion of component property schemas into HubSpot `fields.json` structures.
- **Module Automation**: CLI tool to bundle and generate complete HubSpot Module directories ready for upload.
- **Basic Property Mapping**: Support for standard fields like text, number, image, color, and choice.
- **Project Structure**: Foundation for the Handoff-HubSpot CLI and configuration system.

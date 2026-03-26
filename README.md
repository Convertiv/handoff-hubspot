# Handoff HubSpot Client

A transformer CLI that bridges [Handoff](https://www.handoff.com) design system components and HubSpot CMS modules. It fetches component definitions from the Handoff API, validates them against the HubSpot module specification, and transpiles Handlebars templates into complete, ready-to-deploy HubSpot modules.

---

## How It Works

Handoff publishes design system components as structured JSON payloads that include:

- A **Handlebars template** (`code`) describing the component's markup
- A **property schema** (`properties`) describing the editable fields
- **CSS and JS** assets for styles and behavior
- **Metadata** such as title, description, categories, tags, and versioning

This tool takes those payloads and produces a HubSpot `.module` folder containing:

| File | Description |
|------|-------------|
| `module.html` | HubL template transpiled from the Handlebars source |
| `module.css` | Component CSS (or a blank stub when using the central stylesheet) |
| `module.js` | Component JavaScript (or a blank stub when using the central bundle) |
| `meta.json` | HubSpot module metadata (label, content types, categories, tags) |
| `fields.json` | HubSpot field definitions generated from the property schema |

### Pipeline Overview

```
Handoff API
    │
    ▼
fetchComponent(id)        → HandoffComponent JSON
    │
    ▼
validateModule(component) → FieldValidation[]  (errors/warnings)
    │
    ▼
transpile(code, props)    → HubL string  (module.html)
buildFields(properties)   → HubSpot field definitions  (fields.json)
buildMeta(component)      → HubSpot module metadata  (meta.json)
    │
    ▼
Write *.module/ folder to disk
```

### Handlebars → HubL Transpilation

HubSpot modules use HubL, a Jinja2-like templating language. Handoff components are authored in Handlebars. The transpiler converts each Handlebars construct to its HubL equivalent:

**Variables**

Handoff components reference component data under the `properties` namespace. The transpiler rewrites these to HubSpot's `module` namespace:

```handlebars
{{properties.headline}}
```
becomes:
```hubl
{{ module.headline }}
```

**Conditionals**

```handlebars
{{#if properties.show_cta}}
  <a href="...">Click</a>
{{/if}}
```
becomes:
```hubl
{% if module.show_cta %} <a href="...">Click</a> {% endif %}
```

**Loops**

```handlebars
{{#each properties.items}}
  <li>{{this.label}}</li>
{{/each}}
```
becomes:
```hubl
{% for item_i in module.items %} <li>{{ item_i.label }}</li> {% endfor %}
```

**Typed Field Handling**

The transpiler is property-schema-aware. The way a variable is output depends on its declared type in the property schema. For example, a `button` property named `cta`:

```handlebars
<a href="{{properties.cta.url}}">{{properties.cta.label}}</a>
```
becomes:
```hubl
<a href="{{ module.cta_url.href|escape_attr }}">{{ module.cta_text }}</a>
```

This is because HubSpot represents button/link URLs as a structured `url` object, requiring the `_url.href` accessor and `escape_attr` filter. The transpiler handles these type-specific rewrites automatically for `link`, `button`, `breadcrumb`, `image`, `url`, `video_embed`, and `menu` types.

**Menus**

The `{{#field menu}}` block generates the HubL menu lookup and iteration boilerplate:

```handlebars
{{#field properties.nav}}
  {{#each properties.nav}}
    <li>{{this.label}}</li>
  {{/each}}
{{/field}}
```
becomes:
```hubl
{# field properties.nav type="menu"  #}
{% set menu_xxxxx = menu(module.nav) %}
{% for item_n in menu_xxxxx.children %} <li>{{ item_n.label }}</li> {% endfor %}
{# end field #}
```

**Search Fields**

The `{{#field search}}` block injects the standard HubSpot search context variables (`search_page`, `content_types`, etc.) required for site search module patterns.

### Fields Generation

Each Handoff property type maps to one or more HubSpot field definitions in `fields.json`:

| Handoff type | HubSpot field(s) |
|---|---|
| `text` | `text` |
| `richtext` | `richtext` |
| `number` | `number` (with `min`, `max`, `step`) |
| `boolean` | `boolean` (checkbox display) |
| `select` | `choice` (with `choices` array) |
| `image` | `image` (responsive, lazy-loaded) |
| `icon` | `text` |
| `link` | `url` field (`{id}_url`) + `text` field (`{id}_text`) |
| `button` | `url` field (`{id}_url`) + `text` field (`{id}_text`, labeled "Label") |
| `url` | `url` (all link types supported) |
| `video_file` | `file` field + `text` title field (`{id}_title`) |
| `video_embed` | `text` embed URL + `text` title (`{id}_title`) + `image` poster (`{id}_poster`) |
| `menu` | `menu` |
| `array` | `group` (with `occurrence` min/max, children built recursively) |
| `object` | `group` (children built recursively) |

### Validation

Before transpilation, each component is validated at both the module and field levels.

**Module-level checks** (errors halt the build unless `--force` is used):
- `code`, `title`, `tags`, `categories`, and `properties` are all required
- Each category must be one of the allowed HubSpot categories

**Field-level checks** include both errors (build blockers) and warnings (non-blocking):
- Every field must have a valid `type`, a `name`, and a `rules.required` boolean
- A `description` and `default` value are required (warnings if missing)
- `text` and `number` fields must have `rules.content` with `min`/`max`
- `array` fields must have `rules.content.min`/`max`, `items.type`, and recursively valid children
- `image` fields must have `rules.dimensions` (with `min.width`/`min.height`) and a default with `src`/`alt`
- `link` defaults must include `href` and `text`; `button` defaults must include `url` and `label`
- `select` fields must have an `options` array
- `object` fields must have a `properties` map

---

## Installation

```bash
npm install -g handoff-hubspot
```

## Requirements

- Node 20, NPM
- A running Handoff instance (URL to the API)
- A HubSpot account if you intend to deploy the generated modules

---

## Quick Start

1. **Install**

   ```bash
   npm install -g handoff-hubspot
   ```

2. **Configure**

   ```bash
   handoff-hubspot config
   ```

   This will prompt you interactively for:
   - The URL to your Handoff API (e.g. `https://design.example.com/api/`)
   - Where to save the shared CSS bundle
   - Where to save the shared JS bundle
   - Whether to use per-module CSS/JS or the central compiled bundles
   - Where to write the generated `.module` folders
   - A label prefix for modules inside HubSpot (e.g. `"UDS: "`)
   - Optional HTTP Basic Auth credentials if your Handoff instance requires authentication

   A `handoff.config.json` file is written to the current working directory.

3. **List available components**

   ```bash
   handoff-hubspot list
   ```

4. **Fetch and build a single component**

   ```bash
   handoff-hubspot fetch hero-banner
   ```

   The module is written to `{modulesPath}/hero-banner.module/`.

5. **Fetch and build all components**

   ```bash
   handoff-hubspot fetch:all
   ```

---

## Commands

```
handoff-hubspot config
```
Interactively create or overwrite `handoff.config.json`.

```
handoff-hubspot list
```
List all components available from the Handoff API.

```
handoff-hubspot docs [component]
```
Open the Handoff documentation page for a component in the browser.

```
handoff-hubspot styles
```
Fetch the shared CSS bundle (`main.css`) from the Handoff API and write it to `cssPath`.

```
handoff-hubspot scripts
```
Fetch the shared JS bundle (`main.js`) from the Handoff API and write it to `jsPath`. Skipped automatically when `moduleJS` is `true`.

```
handoff-hubspot fetch [component]
```
Fetch a single component, validate it, transpile it, and write the `.module` folder. Use `--force` (`-f`) to build even when validation errors are present.

```
handoff-hubspot validate [component]
```
Fetch a single component and run validation only (no files are written).

```
handoff-hubspot validate:all
```
Fetch and validate every component. Exits with a non-zero code if any component fails validation.

```
handoff-hubspot fetch:all [--force]
```
Validate and build every component. Without `--force`, aborts the entire run if validation fails.

---

## Configuration Reference (`handoff.config.json`)

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `url` | `string` | `https://localhost:3000/api/` | Base URL of the Handoff API |
| `cssPath` | `string` | `css/uds.css` | Directory for the shared CSS output |
| `jsPath` | `string` | `js/uds.js` | Directory for the shared JS output |
| `modulesPath` | `string` | `modules` | Directory where `.module` folders are written |
| `modulePrefix` | `string` | `UDS: ` | Prefix prepended to each module's label in HubSpot |
| `moduleCSS` | `boolean` | `true` | When `true`, writes per-module CSS; when `false`, writes a blank stub |
| `moduleJS` | `boolean` | `false` | When `true`, writes per-module compiled JS; when `false`, writes a blank stub |
| `username` | `string` | `""` | HTTP Basic Auth username (optional) |
| `password` | `string` | `""` | HTTP Basic Auth password (optional) |
| `componentCSS` | `string[]` | `[]` | Array of component IDs that should have their own CSS files |
| `componentJS` | `string[]` | `[]` | Array of component IDs that should have their own JS files |

### HubDB Data Mappings

To empower component generic arrays or maps to pull real data securely from HubDB instead of requiring static entries, supply a `hubdb_mappings` mapping on your components:

```json
{
  "hubdb_mappings": {
    "bar_chart": {
      "target_property": "data",
      "mapping_type": "xy"
    },
    "category_breakdown_chart": {
      "target_property": "data",
      "mapping_type": "multi_series"
    }
  }
}
```

Handoff-HubSpot automatically injects the HubDB HubL lookup configurations directly into the component's output template dynamically overriding standard AST mapping targets when valid query data is returned.\n

---

## Module Output Structure

Each component produces a folder at `{modulesPath}/{component-id}.module/`:

```
hero-banner.module/
├── module.html    # HubL template (transpiled from Handlebars)
├── module.css     # Component CSS
├── module.js      # Component JavaScript
├── meta.json      # HubSpot module metadata
└── fields.json    # HubSpot field definitions
```

`module.html` opens with a comment block containing the original component metadata:

```
{#
  title: Hero Banner
  description: A full-width hero with headline, body copy, and CTA button
  group: Marketing
  version: 1.4.2
  last_updated: 2026-03-11T00:00:00.000Z
  link: https://design.example.com/system/component/hero-banner
#}
```

Navigation components (group `"Navigation"`) are automatically marked as `global: true` in `meta.json`.

# Handoff → HubSpot Transpilation Specification

This document is the authoritative technical reference for how Handoff component definitions are validated and transpiled into HubSpot CMS module artifacts. All behavior described here is normative.

---

## Table of Contents

1. [Data Model](#1-data-model)
2. [Validation Specification](#2-validation-specification)
3. [Template Transpilation Specification](#3-template-transpilation-specification)
4. [Field Generation Specification](#4-field-generation-specification)
5. [Module Output Specification](#5-module-output-specification)

---

## 1. Data Model

### 1.1 HandoffComponent

The root structure returned by the Handoff API for a single component (`GET /component/{id}.json`).

```typescript
type HandoffComponent = {
  id: string;           // Slug identifier, e.g. "hero-banner"
  version: string;      // Semver string, e.g. "1.4.2"
  title: string;        // Human-readable name, e.g. "Hero Banner"
  description: string;  // Short description
  type: ComponentType;  // Top-level component type (see §1.6)
  preview: string;      // URL to a preview image
  group: string;        // Logical grouping, e.g. "Navigation", "Marketing"
  categories: string[]; // HubSpot category slugs (see §2.1)
  tags: string[];       // Free-form tag strings
  code: string;         // Handlebars source template
  css: string;          // Component scoped CSS
  js: string;           // Component JavaScript source
  jsCompiled?: string;  // Compiled/bundled JavaScript (optional)
  previews: { [key: string]: PreviewDefinition };
  properties: { [key: string]: PropertyDefinition };
};
```

### 1.2 PropertyDefinition

Describes a single editable field in a component.

```typescript
interface PropertyDefinition {
  name: string;                // Display label for HubSpot UI
  type: FieldType;             // One of the types listed in §1.3
  description: string;         // Help text shown in HubSpot UI
  rules: RulesDefinition;
  default: ValueDefinition;    // Default value; shape depends on type
  properties?: { [key: string]: PropertyDefinition }; // For type="object"
  items?: PropertyDefinition;  // For type="array"
  options?: { value: string; label: string }[] | string[]; // For type="select"
  id?: string;                 // Derived; set during field building
}
```

### 1.3 FieldType

All recognized field types:

```
text | richtext | number | boolean | checkbox
select | image | icon | button | link | url
breadcrumb | video_file | video_embed | file
array | object | menu | search | pagination | hubdbtable
```

### 1.4 ComponentType

The top-level type of a Handoff component, used for import filtering (§1.7):

```
element | block | data
```

### 1.5 RulesDefinition

```typescript
interface RulesDefinition {
  required?: boolean;
  content?: {
    min: number;
    max: number;
    prefix?: string;
    suffix?: string;
  };
  dimensions?: {
    width?: number;
    height?: number;
    min: { width: number; height: number; };
    max?: { width: number; height: number; };
    recommend?: { width: number; height: number; };
  };
  filesize?: number;
  pattern?: string;   // Validation message / regex pattern
}
```

### 1.6 Default Value Shapes by Type

| Type | Expected default shape |
|------|------------------------|
| `text`, `richtext`, `number`, `icon`, `file`, `search`, `pagination` | `string` or `number` |
| `boolean`, `checkbox` | `boolean` |
| `select` | `string` (one of the option values) |
| `image` | `{ src: string; alt: string; }` |
| `link` | `{ href: string; text: string; }` |
| `button` | `{ url: string; label: string; }` |
| `breadcrumb` | `{ label: string; url: string; active: boolean; }[]` |
| `video_file` | `{ src: string; title: string; }` |
| `video_embed` | `{ url: string; title: string; poster: { src: string; alt: string; } }` |
| `url` | `string` (href) |
| `menu` | any (passed through) |
| `array`, `object` | omitted or `null` |

### 1.7 Import Configuration

The `import` key on `AppConfig` controls which components are transpiled and how they are built. It consolidates the former `hubdb_mappings`, `componentJS`, and `componentCSS` top-level keys into a single hierarchical structure.

```typescript
import?: {
  [componentType: string]: ImportTypeConfig;
};

type ImportTypeConfig = boolean | {
  [componentId: string]: boolean | ComponentImportConfig;
};

interface ComponentImportConfig {
  type?: "hubdb";
  target_property?: string;
  mapping_type?: "xy" | "multi_series";
  js?: boolean;
  css?: boolean;
}

interface HubdbMapping {
  target_property: string;
  mapping_type: "xy" | "multi_series";
}
```

**Resolution algorithm** (`getComponentImportConfig(config, componentType, componentId)`):

1. If `config.import` is absent → return `true` (import normally).
2. Look up `config.import[componentType]`:
   - `undefined` → return `true`.
   - `false` → return `null` (skip all components of this type).
   - `true` → return `true`.
3. Look up `typeConfig[componentId]`:
   - `undefined` → return `true`.
   - `false` → return `null` (skip this component).
   - `true` → return `true`.
   - `ComponentImportConfig` object → return the object.

**Derived helpers:**

| Helper | Behavior |
|--------|----------|
| `shouldImportComponent(config, type, id)` | Returns `false` when the resolved config is `null`; `true` otherwise. Used by `fetchAll` and `validateAll` to skip excluded components. |
| `getHubdbMapping(config, type, id)` | Returns a `HubdbMapping` when the resolved config has `type === "hubdb"` with valid `target_property` and `mapping_type`; `null` otherwise. Passed directly to the transpiler and field generator. |

**Per-component JS/CSS resolution:**

When the resolved `ComponentImportConfig` has `js: true`, the build writes the component's own JavaScript even if the global `moduleJS` is `false`. The same applies for `css: true` and `moduleCSS`.

---

## 2. Validation Specification

Validation runs before transpilation. Components excluded by the `import` configuration (§1.7) are skipped entirely during `validateAll`. A component that fails with one or more **errors** will not be built unless the `--force` flag is passed. **Warnings** are surfaced but do not block the build.

### 2.1 Module-Level Validation

| Check | Severity | Rule |
|-------|----------|------|
| `code` present | error | Component must have a non-empty Handlebars template |
| `title` present | error | Component must have a non-empty title |
| `tags` present | error | Must be a non-null array |
| `tags` is array | error | Value must be an array |
| `categories` present | error | Must be a non-null array |
| `categories` is array | error | Value must be an array |
| `categories` values valid | error | Each value must be one of the allowed set (see below) |
| `properties` present | error | Component must have a properties object |

**Allowed category values:**

```
blog | body_content | commerce | design | functionality
forms_and_buttons | media | social | text
```

### 2.2 Field-Level Validation

Applied recursively to every property in `properties`, as well as to any `items.properties` (for `array`) and nested `properties` (for `object`).

#### Universal checks (all types)

| Check | Severity | Rule |
|-------|----------|------|
| `key` present | error | Field must have a non-empty key |
| `key` is not `"id"` | error | `"id"` is a reserved key |
| `type` present | error | `type` is required |
| `type` valid | error | Must be a member of `FieldTypes` |
| `name` present | error | Field must have a human-readable name |
| `description` present | warning | Help text is expected |
| `default` present | warning | A default value is expected (except for `array`, `object`, `pagination`) |
| `rules` present | warning | Rules block is expected |
| `rules.required` is boolean | error | Must be `true` or `false` (not absent) |

#### `rules.content` checks (all types that declare content rules)

| Check | Severity | Rule |
|-------|----------|------|
| `rules.content.min` present when required | warning | Content with `required: true` should declare a minimum |
| `rules.content.max` present | warning | Maximum is expected |

#### Type-specific checks

**`text`**

| Check | Severity | Rule |
|-------|----------|------|
| `rules.content` present | error | Text fields must declare content constraints |

**`number`**

| Check | Severity | Rule |
|-------|----------|------|
| `rules.content` present | error | Number fields must declare content constraints |
| `rules.content.min` present | error | Minimum is required |
| `rules.content.max` present | error | Maximum is required |

**`select`**

| Check | Severity | Rule |
|-------|----------|------|
| `options` present | error | Select fields must provide an options array |

**`link`**

| Check | Severity | Rule |
|-------|----------|------|
| `default` is object | error | Default must be an object |
| `default.href` present | error | Default must include `href` |
| `default.text` present | error | Default must include `text` |

**`button`**

| Check | Severity | Rule |
|-------|----------|------|
| `default` is object | error | Default must be an object |
| `default.url` present | error | Default must include `url` |
| `default.label` present | error | Default must include `label` |

**`image`**

| Check | Severity | Rule |
|-------|----------|------|
| `default` is object | error | Default must be an object |
| `default.src` present | error | Default must include `src` |
| `default.alt` present | error | Default must include `alt` |
| `rules.dimensions` present | error | Image fields must declare dimension constraints |
| `rules.dimensions.min` present | error | Minimum dimensions are required |
| `rules.dimensions.min.width` present | error | Minimum width is required |
| `rules.dimensions.min.height` present | error | Minimum height is required |

**`array`**

| Check | Severity | Rule |
|-------|----------|------|
| `rules.content` present | error | Array fields must declare content constraints |
| `rules.content.min >= 1` when `required: true` | error | Required arrays must allow at least one item |
| `rules.content.max` present and `>= 1` | error | Maximum count must be declared and positive |
| `items` present | error | Array fields must declare an item schema |
| `items.type` present | error | Item type is required |
| `items.type` valid | error | Must be a member of `FieldTypes` |
| `items.properties` present when `items.type === "object"` | error | Object items must declare properties |
| `items.properties` present when `items.type === "array"` | error | Nested arrays must declare properties |
| Each child property valid | error | Recurse into `items.properties` |

**`object`**

| Check | Severity | Rule |
|-------|----------|------|
| `properties` present | error | Object fields must declare a properties map |
| Each child property valid | error | Recurse into `properties` |

---

## 3. Template Transpilation Specification

The transpiler accepts the Handlebars source string and the `properties` map and emits a HubL string. It works by parsing the Handlebars AST and recursively converting each AST node.

### 3.1 AST Node Types

| Handlebars AST node | Handler |
|---------------------|---------|
| `MustacheStatement` | `mustache()` |
| `BlockStatement` | `block()` |
| `TextNode` | Pass through unchanged |
| `ContentStatement` | Pass through unchanged |
| `Program` | `program()` — recurse into children |

### 3.2 Context and State

The transpiler maintains the following mutable state during a single run. State is reset at the start of every `transpile()` call.

| Variable | Purpose |
|----------|---------|
| `iterator: string[]` | Stack of loop variable names (e.g. `["item_i", "item_c"]`) |
| `chain: PropertyDefinition[]` | Stack of the currently active property at each loop depth |
| `currentProperty` | The `PropertyDefinition` for the property in scope |
| `inMenuContext` | The HubL variable name holding a rendered menu, when inside a `{{#field menu}}` block |

### 3.3 Variable Namespace Translation

All Handlebars paths beginning with `properties.` are rewritten to `module.`:

```
properties.x         → module.x
properties.x.y       → module.x.y
../properties.x      → module.x   (parent-scope lookup flattened)
```

Inside an `{{#each}}` loop the loop variable replaces `this`:

```
this (bare)          → item_{firstChar}
this.fieldName       → item_{firstChar}.fieldName
```

Loop metadata variables:

```
@index               → loop.index
@first               → loop.first
@last                → loop.last
@length              → loop.length
```

> **Note on index alignment:** HubSpot loop indexes start at 1. When the `eq` helper compares `@index` against a `NumberLiteral`, the transpiler increments the literal by 1 so the authored Handlebars (0-based) maps correctly.

### 3.4 MustacheStatement (`{{ }}`)

Output format: `{{ <value> }}`

The property type of the referenced field determines how the path is rendered:

| Parent property type | Handlebars sub-path | HubL output |
|---------------------|---------------------|-------------|
| `link` / `button` / `breadcrumb` | `.label` or `.text` | `module.{id}_text` |
| `link` / `button` / `breadcrumb` | `.href` or `.url` | `module.{id}_url.href\|escape_attr` |
| `link` / `button` / `breadcrumb` | `.rel` | `module.{id}.rel\|escape_attr` |
| `url` | (bare) | `module.{id}.href\|escape_attr` |
| `video_embed` | `.poster` | `module.{id}_poster` |
| `video_embed` | `.title` | `module.{id}_title` |
| `video_embed` | `.url` | *(omitted — no output)* |
| `menu` | any sub-path | `{context}.{sub-path}` |
| any other | `.label` | `module.{id}.field_label` |
| any other | any other sub-path | `module.{id}.{sub-path}` |

Special bare values:

| Handlebars value | HubL output |
|-----------------|-------------|
| `this` (inside loop) | `{{ item_{c}.{field} }}` |
| `@index` | `{{ loop.index }}` |
| `search_page` | `{{ search_page }}` |

### 3.5 BlockStatement — `{{#if}}`

```handlebars
{{#if <condition>}}
  ...body...
{{else}}
  ...inverse...
{{/if}}
```

Emits:

```hubl
{% if <condition> %} ...body... {% else %} ...inverse... {% endif %}
```

**Condition rewriting rules (applied after namespace translation):**

| Handoff property type | Checked sub-path | HubL condition |
|-----------------------|-----------------|----------------|
| `link` | `.href` | `module.{id}_url.href` |
| `button` | `.href` | `module.{id}_url.href` |
| `button` | `.target` | `module.{id}_url.type == 'EXTERNAL'` |
| `link` | `.target` | `module.{id}_url.type == 'EXTERNAL'` |
| `button` / `breadcrumb` | a nested property | `module.{id}_{nestedProp}_url.href` |
| `video_embed` | `.poster` | `module.{id}_poster` |
| `url` | (bare) | `module.{id}.href` |

**Loop metadata conditions:**

```
@first  → loop.first
@last   → loop.last
@index  → loop.index
@length → loop.length
```

### 3.6 BlockStatement — `{{#unless}}`

```handlebars
{{#unless <condition>}}...{{/unless}}
```

Emits:

```hubl
{% unless <condition> %} ... {% endunless %}
```

Condition rewriting follows the same rules as `{{#if}}` (§3.5).

### 3.7 BlockStatement — `{{#each}}`

```handlebars
{{#each properties.items}}
  ...body...
{{/each}}
```

Emits:

```hubl
{% for item_{c} in module.items %} ...body... {% endfor %}
```

The loop variable is `item_` followed by the first character of the iterated property name. The `iterator` stack is pushed before processing the body and popped after.

When inside a `{{#field menu}}` block (see §3.8), the each target is automatically redirected:

```hubl
{% for item_{c} in {menuContext}.children %} ...body... {% endfor %}
```

### 3.8 BlockStatement — `{{#field}}`

The `field` block is a Handoff-specific construct used to annotate a section of the template with its field type. It emits a HubL comment marker and wraps the inner program.

```handlebars
{{#field properties.nav}}
  ...body...
{{/field}}
```

Emits:

```hubl
{# field properties.nav type="{resolved_type}"  #}
...body...
{# end field #}
```

**Type-specific field block behavior:**

| Field type | Additional output |
|------------|-------------------|
| `menu` | `{% set menu_{uuid} = menu(module.{path}) %}` injected after the comment; sets `inMenuContext` so that subsequent `{{#each}}` iterates `.children` |
| `search` | Injects the full search context block (see §3.9) |
| all others | No additional output |

### 3.9 Search Context Block

When a `{{#field search}}` block is encountered the following HubL is injected immediately after the field comment, before the body:

```hubl
{% set search_page = module.results.use_custom_search_results_template is truthy
   and module.results.path_id
   ? content_by_id(module.results.path_id).absolute_url
   : site_settings.content_search_results_page_path %}

{% unless (search_page is string_containing "//") %}
  {% set search_page = "/" ~ search_page %}
{% endunless %}

{% set search_page = search_page|regex_replace("http:", "") %}

{% set content_types = [
  { field_name: "website_pages",      content_type: "SITE_PAGE"         },
  { field_name: "landing_pages",      content_type: "LANDING_PAGE"      },
  { field_name: "blog_posts",         content_type: "BLOG_POST"         },
  { field_name: "listing_pages",      content_type: "LISTING_PAGE"      },
  { field_name: "knowledge_articles", content_type: "KNOWLEDGE_ARTICLE" },
  { field_name: "case_studies",       content_type: "HS_CASE_STUDY"     }
] %}
```

### 3.10 `eq` Helper

```handlebars
{{eq @index 0}}
```

Translates to an inline condition expression:

```hubl
loop.index == 1
```

Note the `+1` offset applied to numeric literals when the left operand is `@index` (§3.3).

### 3.12 HubDB Array Mappings

When a component array field is mapped to HubDB via the `import` configuration (§1.7), the transpiler interrupts standard array compilation. It reads `target_property` and `mapping_type` from the resolved `HubdbMapping` (passed through the `TranspileContext`), prepends a HubDB row-fetching script using HubL dict capabilities to map data columns, and replaces all Handlebars references to `properties.{target_property}` with the dynamically constructed `component_data` variable.

The `TranspileContext` stores both `hubdbTargetProperty` and `hubdbMappingType` from the resolved mapping.

### 3.13 Post-Processing

After transpilation the HubL string is passed through `prettier` with the `prettier-plugin-jinja-template` parser. If formatting fails (e.g. due to an untranslated Handlebars construct) the unformatted string is used and a warning is logged.

A comment header block is prepended to `module.html`:

```hubl
{#
  title: {component.title}
  description: {component.description}
  group: {component.group}
  version: {component.version}
  last_updated: {ISO timestamp}
  link: {handoffOrigin}/system/component/{component.id}
#}
```

---

## 4. Field Generation Specification

`buildFields(properties, parentId?)` converts the Handoff property map into a HubSpot `fields.json` array. Fields with `null`/`undefined` results are filtered out.

### 4.1 Base Field Structure

All field types start from a base object:

```json
{
  "id": "{parentId_}{key}",
  "name": "{key}",
  "label": "{property.name}",
  "required": {property.rules.required},
  "help_text": "{property.description}",
  "locked": false,
  "allow_new_line": false,
  "show_emoji_picker": false,
  "type": "text",
  "display_width": null,
  "default": {property.default}
}
```

- `id` and `name` are constructed from the property key. When a `parentId` is provided (inside an `array` or `object` group), the id is prefixed: `{parentId}_{key}`.
- `name` is the raw key converted to a safe label (lowercase, underscores).
- `label` is the human-readable `property.name`.

### 4.2 Type-by-Type Field Generation

#### `text`

Extends base field. If `rules.pattern` is set, adds `validation_message`.

```json
{ "type": "text" }
```

#### `richtext`

```json
{ "type": "richtext" }
```

#### `number`

```json
{
  "type": "number",
  "min": {rules.content.min},
  "max": {rules.content.max},
  "step": 1,
  "prefix": "{rules.content.prefix || ''}",
  "suffix": "{rules.content.suffix || ''}"
}
```

#### `boolean`

```json
{
  "type": "boolean",
  "display": "checkbox"
}
```

#### `select`

```json
{
  "type": "choice",
  "display": "select",
  "choices": [ ["{value}", "{label}"], ... ],
  "multiple": false,
  "reordering_enabled": false
}
```

String-only options are expanded to `[value, value]` tuples.

#### `image`

```json
{
  "type": "image",
  "responsive": true,
  "default": {
    "size_type": "exact",
    "src": "{default.src}",
    "alt": "{default.alt}",
    "loading": "lazy",
    "width": "{rules.dimensions.width || 128}",
    "height": "{rules.dimensions.height || 128}",
    "max_width": "{rules.dimensions.max.width || 128}",
    "max_height": "{rules.dimensions.max.height || 128}"
  }
}
```

#### `icon`

Treated as a plain `text` field.

#### `link`

Produces **two** fields:

1. **URL field** — id: `{key}_url`, name: `{key}_url`, type: `url`

```json
{
  "id": "{key}_url",
  "name": "{key}_url",
  "type": "url",
  "supported_types": ["EXTERNAL","CONTENT","FILE","EMAIL_ADDRESS","BLOG","PHONE_NUMBER","PAYMENT"],
  "default": {
    "content_id": null,
    "type": "EXTERNAL",
    "href": "{default.href}"
  }
}
```

The `type` within `default` is inferred from the `href` prefix:
- `http...` → `EXTERNAL`
- `mailto:` → `EMAIL_ADDRESS`
- `tel:` → `PHONE_NUMBER`
- otherwise → `EXTERNAL`

2. **Text field** — id: `{key}_text`, name: `{key}_text`, type: `text`

```json
{
  "id": "{key}_text",
  "name": "{key}_text",
  "label": "{property.name} Text",
  "default": "{default.text || default.label}"
}
```

#### `button`

Produces **two** fields:

1. **URL field** — same as `link` URL field, using `default.url` for `href`
2. **Label field** — id: `{key}_text`, name: `{key}_text`, label appended `" Label"`, default from `default.label || default.text`

#### `url`

```json
{
  "type": "url",
  "supported_types": ["EXTERNAL","CONTENT","FILE","EMAIL_ADDRESS","BLOG","PHONE_NUMBER","PAYMENT"],
  "default": {
    "content_id": null,
    "href": "{default}",
    "type": "EXTERNAL"
  }
}
```

#### `video_file`

Produces **two** fields:

1. **File field** — id: `{key}`, type: `file`
2. **Title field** — id: `{key}_title`, name: `{key}_title`, label appended `" Title"`, help text: `"Title of the video for accessibility"`, default from `default.title`

#### `video_embed`

Produces **three** fields:

1. **Embed URL field** — id: `{key}`, type: `text`, default from `default.url`
2. **Title field** — same as `video_file` title field
3. **Poster field** — id: `{key}_poster`, type: `image`, label appended `" Poster"`, default `src`/`alt` from `default.poster`

#### `menu`

```json
{ "type": "menu" }
```

#### `hubdbtable`

```json
{ "type": "hubdbtable" }
```

#### `array`

Produces a **group** field with `occurrence`:

```json
{
  "type": "group",
  "occurrence": {
    "min": "{rules.content.min || 0}",
    "max": "{rules.content.max || 0}",
    "sorting_label_field": null,
    "default": "{rules.content.min || 0}"
  },
  "children": [ ...recursively built fields from items.properties... ]
}
```

- When `items.type === "object"`: children are built from `items.properties` with `parentId = key`
- When `items.type === "text"`: single child text field with id `{key}_text`

#### `object`

Produces a **group** field (no `occurrence`):

```json
{
  "type": "group",
  "children": [ ...recursively built fields from properties... ]
}
```

Children are built from `property.properties` with `parentId = key`.

### 4.3 HubDB Source Field Auto-Generation

When a component has a resolved `HubdbMapping` (§1.7), the field generator calls `processHubdbMappings(fields, hubdbMapping)` after `buildFields`. This function mutates the `fields` array in place:

1. **Locate the target field** — finds the field whose `name` matches `mapping.target_property`. If not found, the function returns early.

2. **Inject a `source` choice field** at the target field's index position:

```json
{
  "id": "source",
  "name": "source",
  "label": "Data Source",
  "type": "choice",
  "display": "select",
  "choices": [["query", "Query Builder"], ["manual", "Manual Data"]],
  "default": "manual",
  "help_text": "Choose how data is provided to this module."
}
```

3. **Inject a `query_configs` group field** containing the HubDB query builder fields (table selector, column mappings, sort, limit, and diagnostic toggle). This group has a visibility rule showing it only when `source == "query"`:

```json
{
  "visibility": {
    "controlling_field_path": "source",
    "controlling_value_regex": "query",
    "operator": "EQUAL"
  }
}
```

The group's children vary by `mapping_type`:
- **`xy`**: adds a `y_column` text field for the Y-axis column name.
- **`multi_series`**: adds a `y_series` repeatable group with `series_name`, `y_column`, and `color` fields.

4. **Gate the target array field** — adds a visibility rule to the original target field so it only appears when `source == "manual"`:

```json
{
  "visibility": {
    "controlling_field_path": "source",
    "controlling_value_regex": "manual",
    "operator": "EQUAL"
  }
}
```

The final field order at the injection point is: `source` → `query_configs` → original target field.

### 4.4 Unrecognized Types

Types not listed in §4.2 (`breadcrumb`, `video_file` with unknown sub-types, `file`, `search`, `pagination`, `checkbox`) produce no output and are silently dropped from the `fields.json` array.

---

## 5. Module Output Specification

### 5.1 Folder Naming

The module folder name is derived from the component `id` with all non-alphanumeric characters replaced by hyphens:

```
{modulesPath}/{sanitized-id}.module/
```

### 5.2 `module.html`

- Content: header comment block (§3.11) + Prettier-formatted HubL string
- Encoding: UTF-8

### 5.3 `module.css`

- When the resolved `ComponentImportConfig` has `css: true`, OR the global `config.moduleCSS === true`: the raw `component.css` string
- Otherwise: `/** We are using the core compiled css. This file is blank */`

### 5.4 `module.js`

- When the resolved `ComponentImportConfig` has `js: true`, OR the global `config.moduleJS === true`:
  - If `component.jsCompiled` is set: the compiled JS bundle
  - If `component.jsCompiled` is absent: `/** This file is blank */`
- Otherwise: `/** We are using the core compiled JS. This file is blank */`

### 5.5 `meta.json`

```json
{
  "label": "{config.modulePrefix}{component.title}",
  "css_assets": [],
  "external_js": [],
  "global": false,
  "help_text": "{component.description}",
  "content_types": [
    "LANDING_PAGE","KNOWLEDGE_BASE","QUOTE_TEMPLATE",
    "LANDING_PAGE","SITE_PAGE","CUSTOMER_PORTAL",
    "BLOG_LISTING","WEB_INTERACTIVE","BLOG_POST","MEMBERSHIP"
  ],
  "js_assets": [],
  "other_assets": [],
  "smart_type": "NOT_SMART",
  "categories": "{component.categories}",
  "tags": "{component.tags}"
}
```

When `component.group === "Navigation"`, `global` is set to `true`.

### 5.6 `fields.json`

A JSON array produced by `buildFields(component.properties)` as specified in §4. When a `HubdbMapping` is resolved for the component, `processHubdbMappings` (§4.3) is applied to inject source selection and query configuration fields. Serialized with 2-space indentation.

### 5.7 Write Behavior

Components excluded by the `import` configuration (§1.7) are skipped entirely during `fetchAll` — no directory or files are created. For included components, files are written asynchronously. If the target `.module` directory does not exist it is created recursively (`fs.mkdirSync(..., { recursive: true })`). Existing files are overwritten without prompting.

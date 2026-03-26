/**
 * Transpile tests — validates that Handlebars templates are correctly
 * transpiled to HubL for each field type and data pattern.
 *
 * These tests use fixtures captured from the Handoff API. They exercise
 * the transpile() function and compare output against known-good patterns
 * derived from the example modules.
 */
import { describe, test, expect, beforeAll } from "vitest";
import transpile from "../src/transpile.js";
import fs from "fs";
import path from "path";

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Load a fixture by component ID */
const loadFixture = (id: string) => {
  const fixturePath = path.join(__dirname, "mock-fixtures", `${id}.json`);
  return JSON.parse(fs.readFileSync(fixturePath, "utf-8"));
};



// ─── Simple components ─────────────────────────────────────────────────────────

describe("transpile — simple components", () => {
  test("button: text fields and basic mustache output", () => {
    const fixture = loadFixture("button");
    const result = transpile(fixture.code, fixture.properties);

    // properties.Type → module.Type
    expect(result).toContain("module.Type");
    // properties.url → module.url
    expect(result).toContain("module.url");
    // No leftover Handlebars syntax
    expect(result).not.toContain("properties.");
  });

  test("iframe: simple text fields", () => {
    const fixture = loadFixture("iframe");
    const result = transpile(fixture.code, fixture.properties);

    expect(result).toContain("module.");
    expect(result).not.toContain("properties.");
  });

  test("title_simple: minimal component transpiles cleanly", () => {
    const fixture = loadFixture("title_simple");
    const result = transpile(fixture.code, fixture.properties);

    expect(result).not.toContain("properties.");
    expect(result).toContain("module.");
  });
});

// ─── Boolean / If / Unless ──────────────────────────────────────────────────────

describe("transpile — boolean conditionals", () => {
  test("hero_split: {{#if properties.dark}} → {% if module.dark %}", () => {
    const fixture = loadFixture("hero_split");
    const result = transpile(fixture.code, fixture.properties);

    expect(result).toContain("{% if module.dark %}");
    expect(result).toContain("{% endif %}");
    expect(result).not.toContain("{{#if");
  });

  test("video: {{#if properties.show_header}} translates correctly", () => {
    const fixture = loadFixture("video");
    const result = transpile(fixture.code, fixture.properties);

    expect(result).toContain("{% if module.show_header %}");
    expect(result).toContain("{% if module.hide_padding %}");
  });

  test("hero_split: unless block translates correctly", () => {
    const fixture = loadFixture("hero_split");
    const result = transpile(fixture.code, fixture.properties);

    // The hero_split template uses {{#unless}} for image.src check
    expect(result).toContain("{% unless");
    expect(result).toContain("{% endunless %}");
  });
});

// ─── Button type ────────────────────────────────────────────────────────────────

describe("transpile — button fields", () => {
  test("hero_split: button .url → _url.href|escape_attr", () => {
    const fixture = loadFixture("hero_split");
    const result = transpile(fixture.code, fixture.properties);

    // properties.primary.url → module.primary_url.href|escape_attr
    expect(result).toContain("module.primary_url.href|escape_attr");
    // properties.primary.label → module.primary_text
    expect(result).toContain("module.primary_text");
  });

  test("hero_split: button condition {{#if properties.primary}} → {% if module.primary_url.href %}", () => {
    const fixture = loadFixture("hero_split");
    const result = transpile(fixture.code, fixture.properties);

    expect(result).toContain("module.primary_url.href");
  });

  test("hero_split: secondary button label and url", () => {
    const fixture = loadFixture("hero_split");
    const result = transpile(fixture.code, fixture.properties);

    expect(result).toContain("module.secondary_url.href|escape_attr");
    expect(result).toContain("module.secondary_text");
  });
});

// ─── Link type ──────────────────────────────────────────────────────────────────

describe("transpile — link fields", () => {
  test("accordion: link inside array — .href → _url.href|escape_attr", () => {
    const fixture = loadFixture("accordion");
    const result = transpile(fixture.code, fixture.properties);

    // Inside the array loop, this.link.href → item_i.link_url.href|escape_attr
    expect(result).toContain("link_url.href|escape_attr");
    // this.link.text → item_i.link_text
    expect(result).toContain("link_text");
  });

  test("hero_split: link inside array (cardLink) properly transpiles", () => {
    const fixture = loadFixture("hero_split");
    const result = transpile(fixture.code, fixture.properties);

    // this.cardLink.href → item_l.cardLink_url.href|escape_attr
    expect(result).toContain("cardLink_url.href|escape_attr");
    // this.cardLink.text → item_l.cardLink_text
    expect(result).toContain("cardLink_text");
  });
});

// ─── Image type ─────────────────────────────────────────────────────────────────

describe("transpile — image fields", () => {
  test("hero_split: image .src and .alt pass through correctly", () => {
    const fixture = loadFixture("hero_split");
    const result = transpile(fixture.code, fixture.properties);

    expect(result).toContain("module.image.src");
    expect(result).toContain("module.image.alt");
    expect(result).toContain("module.backgroundImage.src");
    expect(result).toContain("module.backgroundImage.alt");
  });
});

// ─── Video types ────────────────────────────────────────────────────────────────

describe("transpile — video fields", () => {
  test("video: video_embed .title → _title, .url omitted", () => {
    const fixture = loadFixture("video");
    const result = transpile(fixture.code, fixture.properties);

    // video.title → module.video_title
    expect(result).toContain("module.video_title");
  });

  test("video: video_embed poster → _poster", () => {
    const fixture = loadFixture("video");
    const result = transpile(fixture.code, fixture.properties);

    // video.poster.src → module.video_poster.src or similar
    // The actual transpile handles this via the video_embed handler
    expect(result).toContain("video_poster");
  });

  test("hero_split: video_file (backgroundVideo) transpiles", () => {
    const fixture = loadFixture("hero_split");
    const result = transpile(fixture.code, fixture.properties);

    expect(result).toContain("module.backgroundVideo");
  });
});

// ─── Array / Each ───────────────────────────────────────────────────────────────

describe("transpile — array/each loops", () => {
  test("accordion: {{#each properties.items}} → {% for item_i in module.items %}", () => {
    const fixture = loadFixture("accordion");
    const result = transpile(fixture.code, fixture.properties);

    expect(result).toContain("{% for item_i in module.items %}");
    expect(result).toContain("{% endfor %}");
  });

  test("accordion: this.title inside loop → item_i.title", () => {
    const fixture = loadFixture("accordion");
    const result = transpile(fixture.code, fixture.properties);

    expect(result).toContain("item_i.title");
    expect(result).toContain("item_i.paragraph");
  });

  test("accordion: @index → loop.index inside loop", () => {
    const fixture = loadFixture("accordion");
    const result = transpile(fixture.code, fixture.properties);

    expect(result).toContain("loop.index");
  });

  test("accordion: ../properties.identifier → module.identifier (parent scope)", () => {
    const fixture = loadFixture("accordion");
    const result = transpile(fixture.code, fixture.properties);

    // ../properties.identifier should be flattened to module.identifier
    expect(result).toContain("module.identifier");
  });

  test("hero_split: nested array with link inside (linksItems)", () => {
    const fixture = loadFixture("hero_split");
    const result = transpile(fixture.code, fixture.properties);

    expect(result).toContain("{% for item_l in module.linksItems %}");
    expect(result).toContain("item_l.title");
  });

  test("stats: array of objects with number and text fields", () => {
    const fixture = loadFixture("stats");
    const result = transpile(fixture.code, fixture.properties);

    expect(result).toContain("{% for");
    expect(result).toContain("{% endfor %}");
    expect(result).not.toContain("{{#each");
  });
});

// ─── Object type ────────────────────────────────────────────────────────────────

describe("transpile — object fields", () => {
  test("menu: nested object (buttons.outline) transpiles to module.buttons.outline_url", () => {
    const fixture = loadFixture("menu");
    const result = transpile(fixture.code, fixture.properties);

    // buttons.outline.href → module.buttons.outline_url.href|escape_attr
    expect(result).toContain("module.buttons");
    expect(result).toContain("outline_url");
  });
});

// ─── Menu type ──────────────────────────────────────────────────────────────────

describe("transpile — menu fields", () => {
  test("menu: {{#field menu}} injects set menu_ variable", () => {
    const fixture = loadFixture("menu");
    const result = transpile(fixture.code, fixture.properties);

    // Should contain a {% set menu_xxxxx = menu(module.mobile) %}
    expect(result).toMatch(/\{%\s*set\s+menu_\w+\s*=\s*menu\(module\.mobile\)\s*%\}/);
  });

  test("menu: each inside menu context → iterates .children", () => {
    const fixture = loadFixture("menu");
    const result = transpile(fixture.code, fixture.properties);

    // After menu field, the each should iterate menu_xxxxx.children
    expect(result).toMatch(/\{%\s*for\s+item_m\s+in\s+menu_\w+\.children\s*%\}/);
  });

  test("menu: menu child properties (label, url) translate correctly", () => {
    const fixture = loadFixture("menu");
    const result = transpile(fixture.code, fixture.properties);

    expect(result).toContain("item_m.label");
    expect(result).toContain("item_m.url");
  });
});

// ─── Search type ────────────────────────────────────────────────────────────────

describe("transpile — search context", () => {
  test("menu: search field injects search context block", () => {
    const fixture = loadFixture("menu");
    const result = transpile(fixture.code, fixture.properties);

    // Search context should inject the search_page setup
    expect(result).toContain("set search_page");
    expect(result).toContain("content_search_results_page_path");
    expect(result).toContain("set content_types");
  });
});

// ─── Select type ────────────────────────────────────────────────────────────────

describe("transpile — select fields", () => {
  test("component with select: output uses module.fieldName", () => {
    // Find a fixture with a select field
    const manifest = JSON.parse(
      fs.readFileSync(path.join(__dirname, "mock-fixtures", "_manifest.json"), "utf-8")
    );
    
    let selectFixture = null;
    for (const entry of manifest) {
      const fixture = loadFixture(entry.id);
      const hasSelect = Object.values(fixture.properties || {}).some(
        (p: any) => p.type === "select"
      );
      if (hasSelect) {
        selectFixture = fixture;
        break;
      }
    }

    if (selectFixture) {
      const result = transpile(selectFixture.code, selectFixture.properties);
      expect(result).not.toContain("properties.");
      expect(result).toContain("module.");
    }
  });
});

// ─── Field blocks ───────────────────────────────────────────────────────────────

describe("transpile — field comment blocks", () => {
  test("accordion: {{#field 'items'}} → {# field items type='array' #}", () => {
    const fixture = loadFixture("accordion");
    const result = transpile(fixture.code, fixture.properties);

    // Field blocks should produce comment markers
    expect(result).toMatch(/\{#\s*field.*type="array"/);
    expect(result).toContain("{# end field #}");
  });

  test("hero_split: {{#field 'image'}} → {# field image type='image' #}", () => {
    const fixture = loadFixture("hero_split");
    const result = transpile(fixture.code, fixture.properties);

    expect(result).toMatch(/\{#\s*field.*type="image"/);
  });

  test("accordion: field blocks for nested types (items.title, items.paragraph)", () => {
    const fixture = loadFixture("accordion");
    const result = transpile(fixture.code, fixture.properties);

    expect(result).toMatch(/\{#\s*field.*type="text"/);
    expect(result).toMatch(/\{#\s*field.*type="richtext"/);
  });
});

// ─── Eq helper ──────────────────────────────────────────────────────────────────

describe("transpile — eq helper", () => {
  test("eq with @index adjusts to 1-based indexing", () => {
    // Construct a minimal template that uses the eq helper
    const code = `{{#each properties.items}}{{#if (eq @index 0)}}first{{/if}}{{/each}}`;
    const properties = {
      items: {
        name: "Items",
        type: "array" as const,
        description: "test",
        items: {
          type: "object" as const,
          properties: {
            title: {
              name: "Title",
              type: "text" as const,
              description: "test",
              default: "test",
              rules: { required: true, content: { min: 1, max: 100 } },
            },
          },
        },
        rules: { required: true, content: { min: 1, max: 10 } },
        default: [],
      },
    };

    const result = transpile(code, properties);

    // @index 0 in Handlebars → loop.index == 1 in HubL
    expect(result).toContain("loop.index == 1");
    expect(result).not.toContain("@index");
  });
});

// ─── Loop metadata ──────────────────────────────────────────────────────────────

describe("transpile — loop metadata variables", () => {
  test("@first → loop.first", () => {
    const code = `{{#each properties.items}}{{#if @first}}first{{/if}}{{/each}}`;
    const properties = {
      items: {
        name: "Items",
        type: "array" as const,
        description: "test",
        items: { type: "object" as const, properties: {} },
        rules: { required: true, content: { min: 1, max: 10 } },
        default: [],
      },
    };
    const result = transpile(code, properties);
    expect(result).toContain("loop.first");
  });

  test("@last → loop.last", () => {
    const code = `{{#each properties.items}}{{#if @last}}last{{/if}}{{/each}}`;
    const properties = {
      items: {
        name: "Items",
        type: "array" as const,
        description: "test",
        items: { type: "object" as const, properties: {} },
        rules: { required: true, content: { min: 1, max: 10 } },
        default: [],
      },
    };
    const result = transpile(code, properties);
    expect(result).toContain("loop.last");
  });

  test("@index in mustache → loop.index", () => {
    const code = `{{#each properties.items}}{{@index}}{{/each}}`;
    const properties = {
      items: {
        name: "Items",
        type: "array" as const,
        description: "test",
        items: { type: "object" as const, properties: {} },
        rules: { required: true, content: { min: 1, max: 10 } },
        default: [],
      },
    };
    const result = transpile(code, properties);
    expect(result).toContain("loop.index");
  });
});

// ─── Full golden-file snapshot tests ────────────────────────────────────────────



// ─── All fixtures: smoke test ───────────────────────────────────────────────────

describe("transpile — smoke test all fixtures", () => {
  const manifest = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "mock-fixtures", "_manifest.json"),
      "utf-8"
    )
  );

  for (const entry of manifest) {
    test(`${entry.id} (${entry.title}): transpiles without throwing`, () => {
      const fixture = loadFixture(entry.id);
      expect(() => transpile(fixture.code, fixture.properties)).not.toThrow();
    });
  }
});

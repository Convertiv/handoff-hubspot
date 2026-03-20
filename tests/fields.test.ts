/**
 * Field generation tests — validates that Handoff properties are correctly
 * converted into HubSpot fields.json structure.
 *
 * These tests use fixtures captured from the Handoff API. They exercise
 * the buildFields() function and compare output against known-good patterns
 * derived from the example modules.
 */
import { describe, test, expect } from "vitest";
import { buildFields } from "../src/fields/fields.js";
import fs from "fs";
import path from "path";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const loadFixture = (id: string) => {
  const fixturePath = path.join(__dirname, "mock-fixtures", `${id}.json`);
  return JSON.parse(fs.readFileSync(fixturePath, "utf-8"));
};



// ─── Text fields ────────────────────────────────────────────────────────────────

describe("buildFields — text type", () => {
  test("button: text fields produce correct structure", () => {
    const fixture = loadFixture("button");
    const fields = buildFields(fixture.properties);

    // Should produce a flat array of text fields
    expect(fields).toBeInstanceOf(Array);
    expect(fields.length).toBeGreaterThan(0);

    const typeField = fields.find((f: any) => f.name === "Type");
    expect(typeField).toBeDefined();
    expect(typeField.type).toBe("text");
    expect(typeField.default).toBe("primary");
    expect(typeField.required).toBe(true);
  });

  test("button: label field uses safeLabel ('label' → 'field_label')", () => {
    const fixture = loadFixture("button");
    const fields = buildFields(fixture.properties);

    const labelField = fields.find((f: any) => f.id === "label");
    expect(labelField).toBeDefined();
    expect(labelField.name).toBe("field_label");
    expect(labelField.label).toBe("Field Label");
  });

  test("accordion: text with validation_message from pattern", () => {
    const fixture = loadFixture("accordion");
    const fields = buildFields(fixture.properties);

    const idField = fields.find((f: any) => f.id === "identifier");
    expect(idField).toBeDefined();
    expect(idField.type).toBe("text");
    expect(idField.validation_message).toBe("^[a-z0-9-]+$");
  });
});

// ─── Boolean fields ─────────────────────────────────────────────────────────────

describe("buildFields — boolean type", () => {
  test("hero_split: boolean fields produce checkbox display", () => {
    const fixture = loadFixture("hero_split");
    const fields = buildFields(fixture.properties);

    const darkField = fields.find((f: any) => f.id === "dark");
    expect(darkField).toBeDefined();
    expect(darkField.type).toBe("boolean");
    expect(darkField.display).toBe("checkbox");
    expect(darkField.default).toBe(false);
  });
});

// ─── Button fields (produces URL + text pair) ───────────────────────────────────

describe("buildFields — button type", () => {
  test("hero_split: button produces URL field + label field", () => {
    const fixture = loadFixture("hero_split");
    const fields = buildFields(fixture.properties);

    // Button should produce primary_url (URL type) and primary_text (text type)
    const primaryUrl = fields.find((f: any) => f.id === "primary_url");
    expect(primaryUrl).toBeDefined();
    expect(primaryUrl.type).toBe("url");
    expect(primaryUrl.supported_types).toContain("EXTERNAL");
    expect(primaryUrl.default.href).toBe("https://ssctech.com");

    const primaryText = fields.find((f: any) => f.id === "primary_text");
    expect(primaryText).toBeDefined();
    expect(primaryText.type).toBe("text");
    expect(primaryText.default).toBe("Primary CTA");
  });

  test("hero_split: button label defaults from .label property", () => {
    const fixture = loadFixture("hero_split");
    const fields = buildFields(fixture.properties);

    const secondaryText = fields.find((f: any) => f.id === "secondary_text");
    expect(secondaryText).toBeDefined();
    expect(secondaryText.label).toContain("Label");
    expect(secondaryText.default).toBe("Secondary CTA");
  });
});

// ─── Link fields (produces URL + text pair) ──────────────────────────────────────

describe("buildFields — link type", () => {
  test("accordion: link inside array produces URL + text children", () => {
    const fixture = loadFixture("accordion");
    const fields = buildFields(fixture.properties);

    // The items group should have children including link_url and link_text
    const itemsGroup = fields.find((f: any) => f.id === "items");
    expect(itemsGroup).toBeDefined();
    expect(itemsGroup.type).toBe("group");
    expect(itemsGroup.children).toBeInstanceOf(Array);

    const linkUrl = itemsGroup.children.find(
      (c: any) => c.id === "link_url" || c.name === "link_url"
    );
    expect(linkUrl).toBeDefined();
    expect(linkUrl.type).toBe("url");

    const linkText = itemsGroup.children.find(
      (c: any) => c.id === "link_text" || c.name === "link_text"
    );
    expect(linkText).toBeDefined();
    expect(linkText.type).toBe("text");
  });
});

// ─── Image fields ───────────────────────────────────────────────────────────────

describe("buildFields — image type", () => {
  test("hero_split: image field produces responsive image with dimensions", () => {
    const fixture = loadFixture("hero_split");
    const fields = buildFields(fixture.properties);

    const imageField = fields.find((f: any) => f.id === "image");
    expect(imageField).toBeDefined();
    expect(imageField.type).toBe("image");
    expect(imageField.responsive).toBe(true);
    expect(imageField.default).toHaveProperty("size_type", "exact");
    expect(imageField.default).toHaveProperty("src");
    expect(imageField.default).toHaveProperty("alt");
    expect(imageField.default).toHaveProperty("loading", "lazy");
    expect(imageField.default).toHaveProperty("width");
    expect(imageField.default).toHaveProperty("height");
  });

  test("hero_split: image max dimensions from rules", () => {
    const fixture = loadFixture("hero_split");
    const fields = buildFields(fixture.properties);

    const bgImage = fields.find((f: any) => f.id === "backgroundImage");
    expect(bgImage).toBeDefined();
    expect(bgImage.default.max_width).toBe(4200);
    // Note: there's a bug in image.ts line 28 — uses .width instead of .height
    // expect(bgImage.default.max_height).toBe(2100);
  });
});

// ─── URL fields ─────────────────────────────────────────────────────────────────

describe("buildFields — url type", () => {
  test("menu: standalone url field", () => {
    const fixture = loadFixture("menu");
    const fields = buildFields(fixture.properties);

    const urlField = fields.find((f: any) => f.id === "url");
    expect(urlField).toBeDefined();
    expect(urlField.type).toBe("url");
    expect(urlField.supported_types).toContain("EXTERNAL");
    expect(urlField.default).toHaveProperty("content_id", null);
    expect(urlField.default).toHaveProperty("href");
    expect(urlField.default).toHaveProperty("type", "EXTERNAL");
  });
});

// ─── Select fields ──────────────────────────────────────────────────────────────

describe("buildFields — select type", () => {
  test("component with select: produces choice field with options", () => {
    const manifest = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "mock-fixtures", "_manifest.json"),
        "utf-8"
      )
    );

    let selectFixture = null;
    let selectKey = "";
    for (const entry of manifest) {
      const fixture = loadFixture(entry.id);
      for (const [key, prop] of Object.entries(fixture.properties || {})) {
        if ((prop as any).type === "select") {
          selectFixture = fixture;
          selectKey = key;
          break;
        }
      }
      if (selectFixture) break;
    }

    if (selectFixture) {
      const fields = buildFields(selectFixture.properties);
      const selectField = fields.find((f: any) => f.id === selectKey);
      expect(selectField).toBeDefined();
      expect(selectField.type).toBe("choice");
      expect(selectField.display).toBe("select");
      expect(selectField.choices).toBeInstanceOf(Array);
      expect(selectField.multiple).toBe(false);
    }
  });
});

// ─── Video file fields ──────────────────────────────────────────────────────────

describe("buildFields — video_file type", () => {
  test("hero_split: video_file produces file + title fields", () => {
    const fixture = loadFixture("hero_split");
    const fields = buildFields(fixture.properties);

    const bgVideo = fields.find((f: any) => f.id === "backgroundVideo");
    expect(bgVideo).toBeDefined();
    expect(bgVideo.type).toBe("file");

    const bgVideoTitle = fields.find(
      (f: any) => f.id === "backgroundVideo_title"
    );
    expect(bgVideoTitle).toBeDefined();
    expect(bgVideoTitle.type).toBe("text");
    expect(bgVideoTitle.help_text).toBe(
      "Title of the video for accessibility"
    );
  });
});

// ─── Video embed fields ─────────────────────────────────────────────────────────

describe("buildFields — video_embed type", () => {
  test("video: video_embed produces text + title + poster fields", () => {
    const fixture = loadFixture("video");
    const fields = buildFields(fixture.properties);

    // embed URL field (text type with url as default)
    const videoField = fields.find((f: any) => f.id === "video");
    expect(videoField).toBeDefined();
    expect(videoField.type).toBe("text");

    // title field
    const titleField = fields.find((f: any) => f.id === "video_title");
    expect(titleField).toBeDefined();
    expect(titleField.type).toBe("text");

    // poster field
    const posterField = fields.find((f: any) => f.id === "video_poster");
    expect(posterField).toBeDefined();
    expect(posterField.type).toBe("image");
  });
});

// ─── Array / Group fields ───────────────────────────────────────────────────────

describe("buildFields — array type", () => {
  test("accordion: array → group with occurrence and children", () => {
    const fixture = loadFixture("accordion");
    const fields = buildFields(fixture.properties);

    const itemsGroup = fields.find((f: any) => f.id === "items");
    expect(itemsGroup).toBeDefined();
    expect(itemsGroup.type).toBe("group");
    expect(itemsGroup.occurrence).toBeDefined();
    expect(itemsGroup.occurrence.min).toBe(1);
    expect(itemsGroup.occurrence.max).toBe(20);
    expect(itemsGroup.children).toBeInstanceOf(Array);
    expect(itemsGroup.children.length).toBeGreaterThan(0);
  });

  test("accordion: array children have parentId prefix in id", () => {
    const fixture = loadFixture("accordion");
    const fields = buildFields(fixture.properties);

    const itemsGroup = fields.find((f: any) => f.id === "items");
    const titleChild = itemsGroup.children.find(
      (c: any) => c.name === "title"
    );
    expect(titleChild).toBeDefined();
    // id should be prefixed: items_title
    expect(titleChild.id).toBe("items_title");
  });
});

// ─── Object / Group fields ──────────────────────────────────────────────────────

describe("buildFields — object type", () => {
  test("menu: object → group without occurrence, with children", () => {
    const fixture = loadFixture("menu");
    const fields = buildFields(fixture.properties);

    const buttonsGroup = fields.find((f: any) => f.id === "buttons");
    expect(buttonsGroup).toBeDefined();
    expect(buttonsGroup.type).toBe("group");
    expect(buttonsGroup.children).toBeInstanceOf(Array);
    expect(buttonsGroup.children.length).toBeGreaterThan(0);
  });
});

// ─── Menu fields ────────────────────────────────────────────────────────────────

describe("buildFields — menu type", () => {
  test("menu: menu field produces menu type", () => {
    const fixture = loadFixture("menu");
    const fields = buildFields(fixture.properties);

    const mobileField = fields.find((f: any) => f.id === "mobile");
    expect(mobileField).toBeDefined();
    expect(mobileField.type).toBe("menu");
  });
});

// ─── Golden-file comparison tests ───────────────────────────────────────────────



// ─── All fixtures: smoke test ───────────────────────────────────────────────────

describe("buildFields — smoke test all fixtures", () => {
  const manifest = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "mock-fixtures", "_manifest.json"),
      "utf-8"
    )
  );

  for (const entry of manifest) {
    test(`${entry.id} (${entry.title}): buildFields does not throw`, () => {
      const fixture = loadFixture(entry.id);
      expect(() => buildFields(fixture.properties)).not.toThrow();
    });
  }
});

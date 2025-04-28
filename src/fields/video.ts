import { buildBaseField, buildBaseGroupField } from "./generic";
import buildImageField from "./image";
import buildPlainTextField, { buildRichTextField } from "./text";
import { PropertyDefinition } from "./types";
import buildUrlField from "./url";

export const buildVideoFileField = (
  id: string,
  property: PropertyDefinition
) => {
  const build = buildBaseField(id, property);
  build["type"] = "file";
  build["display_width"] = null;

  return build;
};

export const buildVideoTitleField = (
  id: string,
  property: PropertyDefinition
) => {
  const build = buildPlainTextField(id, property);
  build["name"] = `${id}_title`;
  build["label"] = build["label"] + " Title";
  build["help_text"] = "Title of the video for accessibility";

  return build;
};

export const buildVideoPosterField = (
  id: string,
  property: PropertyDefinition
) => {
  const build = buildImageField(id, property);
  build["type"] = "image";
  build["name"] = `${id}_poster`;
  build["label"] = build["label"] + " Poster";
  build["display_width"] = null;
  if (
    typeof property.default === "object" &&
    "poster" in property.default &&
    typeof property.default.poster === "object"
  ) {
    if ("src" in property.default.poster)
      build["default"]["src"] = property.default.poster.src;
    if ("alt" in property.default.poster)
      build["default"]["alt"] = property.default.poster.alt;
  }
  return build;
};

export const buildVideoEmbedField = (
  id: string,
  property: PropertyDefinition
) => {
  const build = buildPlainTextField(id, property);
  if (typeof property.default === "object" && "url" in property.default)
    build["default"] = property.default.url || "";
  return build;
};
export default buildVideoFileField;

import { buildBaseField, buildBaseGroupField } from "./generic";
import buildImageField from "./image";
import { buildRichTextField } from "./text";
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

export const buildVideoPosterField = (
  id: string,
  property: PropertyDefinition
) => {
  const build = buildImageField(id, property);
  build["type"] = "image";
  build["name"] = `${id}_poster`;
  build["label"] = build["label"] + " Poster";
  build["display_width"] = null;
  return build;
};

export const buildVideoEmbedField = (
  id: string,
  property: PropertyDefinition
) => {
  const build = buildUrlField(id, property);
  return build;
};
export default buildVideoFileField;

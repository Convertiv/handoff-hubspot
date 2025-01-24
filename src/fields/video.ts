import { buildBaseField, buildBaseGroupField } from "./generic";
import { PropertyDefinition } from "./types";

export const buildVideoFileField = (
  id: string,
  property: PropertyDefinition
) => {
  const build = buildBaseField(id, property);
  build["type"] = "file";
  build["display_width"] = null;
  return build;
};

export const buildVideoEmbedField = (
  id: string,
  property: PropertyDefinition
) => {
  const build = buildBaseGroupField(id, property);
  build["type"] = "group";
};
export default buildVideoFileField;

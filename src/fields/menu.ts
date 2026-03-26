import { buildBaseField, buildBaseGroupField } from "./generic.js";
import { PropertyDefinition } from "./types.js";

export const buildMenuField = (id: string, property: PropertyDefinition, parentId?: string) => {
  const build = buildBaseField(id, property, parentId);
  build["type"] = "menu";
  return build;
};

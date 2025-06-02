import { buildBaseField, buildBaseGroupField } from "./generic";
import { PropertyDefinition } from "./types";

export const buildMenuField = (id: string, property: PropertyDefinition, parentId?: string) => {
  const build = buildBaseField(id, property, parentId);
  build["type"] = "menu";
  return build;
};

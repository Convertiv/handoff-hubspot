import { buildBaseField, buildBaseGroupField } from "./generic";
import { PropertyDefinition } from "./types";

export const buildMenuField = (id: string, property: PropertyDefinition) => {
  const build = buildBaseField(id, property);
  build["type"] = "menu";
  return build;
};

import { buildBaseField, buildBaseGroupField } from "./generic";
import { PropertyDefinition } from "./types";

export const buildMenuField = (id: string, property: PropertyDefinition, groupId: string | undefined) => {
  const build = buildBaseField(id, property, groupId);
  build["type"] = "menu";
  return build;
};

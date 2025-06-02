import { buildBaseField } from "./generic";
import { PropertyDefinition } from "./types";

const buildSelectField = (id: string, property: PropertyDefinition, parentId?: string) => {
  const build = buildBaseField(id, property, parentId);
  build["display"] = "select";
  build["choices"] = property.options.map((option) => {
    if (typeof option === "string") {
      return [option, option];
    }
    return [option.value, option.label];
  });
  build["multiple"] = false;
  build["reordering_enabled"] = false;
  build["type"] = "choice";
  return build;
};

export default buildSelectField;

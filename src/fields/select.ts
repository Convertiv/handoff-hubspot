import { buildBaseField } from "./generic";
import { PropertyDefinition } from "./types";

const buildSelectField = (id: string, property: PropertyDefinition, groupId: string | undefined) => {
  const build = buildBaseField(id, property, groupId);
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

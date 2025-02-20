import { buildBaseField } from "./generic";
import { PropertyDefinition } from "./types";

const buildSelectField = (id: string, property: PropertyDefinition) => {
  const build = buildBaseField(id, property);
  build["display"] = "select";
  build["choices"] = property.options.map((option) => {
    return [option.value, option.label];
  });
  build["multiple"] = false;
  build["reordering_enabled"] = false;
  build["type"] = "choice";
  return build;
};

export default buildSelectField;

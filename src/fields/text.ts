import { buildBaseField } from "./generic";
import { PropertyDefinition } from "./types";

const buildPlainTextField = (id: string, property: PropertyDefinition) => {
  const build = buildBaseField(id, property);
  if (property.rules.pattern) {
    build["validation_message"] = property.rules.pattern;
  }
  return build;
};
export default buildPlainTextField;

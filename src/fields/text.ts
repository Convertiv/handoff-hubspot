import { buildBaseField } from "./generic";
import { PropertyDefinition } from "./types";

const buildPlainTextField = (id: string, property: PropertyDefinition) => {
  const build = buildBaseField(id, property);
  if (property.rules.pattern) {
    build["validation_message"] = property.rules.pattern;
  }
  return build;
};

export const buildRichTextField = (
  id: string,
  property: PropertyDefinition
) => {
  const build = buildBaseField(id, property);
  build["type"] = "richtext";
  if (property.rules.pattern) {
    build["validation_message"] = property.rules.pattern;
  }
  return build;
};

export const buildLinkTextField = (
  id: string,
  property: PropertyDefinition
) => {
  const build = buildBaseField(id, property);
  build["name"] = `${id}_text`;
  build["label"] = build["label"] + " Text";
  if (property.rules.pattern) {
    build["validation_message"] = property.rules.pattern;
  }
  let defaultText = "";
  if (typeof property.default === "object" && "label" in property.default) {
    defaultText = property.default?.label;
  }
  build["default"] = defaultText;
  return build;
};
export default buildPlainTextField;

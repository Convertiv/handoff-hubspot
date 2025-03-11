import { buildBaseField } from "./generic";
import { PropertyDefinition } from "./types";

const buildPlainTextField = (id: string, property: PropertyDefinition) => {
  const build = buildBaseField(id, property);
  if (property.rules) {
    if (property.rules.pattern) {
      build["validation_message"] = property.rules.pattern;
    }
  }
  return build;
};

export const buildRichTextField = (
  id: string,
  property: PropertyDefinition
) => {
  const build = buildBaseField(id, property);
  build["type"] = "richtext";
  if (property.rules) {
    if (property.rules.pattern) {
      build["validation_message"] = property.rules.pattern;
    }
  }
  return build;
};

export const buildNumberField = (id: string, property: PropertyDefinition) => {
  const build = buildBaseField(id, property);
  build["type"] = "number";
  build["min"] = property.rules.content.min;
  build["max"] = property.rules.content.max;
  build["step"] = 1;
  build["prefix"] = "";
  build["suffix"] = "";
  if (property.rules) {
    if (property.rules.content.prefix) {
      build["prefix"] = property.rules.content.prefix;
    }
    if (property.rules.content.suffix) {
      build["suffix"] = property.rules.content.suffix;
    }
    if (property.rules.pattern) {
      build["validation_message"] = property.rules.pattern;
    }
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
  if (property.rules) {
    if (property.rules.pattern) {
      build["validation_message"] = property.rules.pattern;
    }
  }
  let defaultText = "";
  if (typeof property.default === "object" && "label" in property.default) {
    defaultText = property.default?.label;
  }
  if (typeof property.default === "object" && "text" in property.default) {
    defaultText = property.default?.text;
  }
  build["default"] = defaultText;
  return build;
};
export default buildPlainTextField;

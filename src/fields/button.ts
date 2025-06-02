import { buildBaseField } from "./generic";
import { PropertyDefinition } from "./types";

const buildButtonUrlField = (id: string, property: PropertyDefinition) => {
  const build = buildBaseField(id, property);
  build["id"] = `${id}_url`;
  build["name"] = `${id}_url`;
  build["type"] = "url";
  build["supported_types"] = [
    "EXTERNAL",
    "CONTENT",
    "FILE",
    "EMAIL_ADDRESS",
    "BLOG",
    "PHONE_NUMBER",
    "PAYMENT",
  ];
  let href = "#";
  let type = "EXTERNAL";
  if (typeof property.default === "object" && "href" in property.default) {
    href = property.default?.href;
  }
  if (typeof property.default === "object" && "url" in property.default) {
    href = property.default?.url;
  }
  if (href === "") {
    href = "#";
  }
  if (href.startsWith("http")) {
  } else if (href.startsWith("mailto:")) {
    type = "EMAIL_ADDRESS";
  } else if (href.startsWith("tel:")) {
    type = "PHONE_NUMBER";
  }

  build["default"] = {
    content_id: null,
    type,
    href,
  };
  return build;
};

export const buildButtonLabelField = (
  id: string,
  property: PropertyDefinition 
) => {
  const build = buildBaseField(id, property);
  build["id"] = `${id}_text`;
  build["name"] = `${id}_text`;
  build["label"] = build["label"] + " Label";
  if (property.rules.pattern) {
    build["validation_message"] = property.rules.pattern;
  }
  let defaultText = "";
  if (typeof property.default === "object" && "text" in property.default) {
    defaultText = property.default?.text;
  }
  if (typeof property.default === "object" && "label" in property.default) {
    defaultText = property.default?.label;
  }
  build["default"] = defaultText;
  return build;
};

export default buildButtonUrlField;

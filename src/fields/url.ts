import { buildBaseField } from "./generic";
import { PropertyDefinition } from "./types";

const buildUrlField = (id: string, property: PropertyDefinition) => {
  const build = buildBaseField(id, property);
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
  build["default"] = {
    content_id: null,
    href: property.default || "",
    type: "EXTERNAL",
  };
  return build;
};
export default buildUrlField;

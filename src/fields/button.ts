import { buildBaseField } from "./generic";
import { PropertyDefinition } from "./types";

const buildButtonUrlField = (id: string, property: PropertyDefinition) => {
  const build = buildBaseField(id, property);
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
    if (href === "") {
      href = "#";
    }
    if (href.startsWith("http")) {
    } else if (href.startsWith("mailto:")) {
      type = "EMAIL_ADDRESS";
    } else if (href.startsWith("tel:")) {
      type = "PHONE_NUMBER";
    }
  }

  build["default"] = {
    content_id: null,
    type,
    href,
  };
  return build;
};

export default buildButtonUrlField;

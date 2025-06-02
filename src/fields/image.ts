import { buildBaseField } from "./generic";
import buildPlainTextField, { buildRichTextField } from "./text";
import { PropertyDefinition } from "./types";
import { ImageValue } from "./types";

const buildImageField = (id: string, property: PropertyDefinition, parentId?: string) => {
  const build = buildBaseField(id, property, parentId);
  build["type"] = "image";
  build["responsive"] = true;
  let defaultSrc = "";
  let defaultAlt = "";
  if (typeof property.default === "object" && "src" in property.default) {
    defaultSrc = property.default?.src;
  } else if (typeof property.default === "string") {
    defaultSrc = property.default;
  }
  if (typeof property.default === "object" && "alt" in property.default) {
    defaultAlt = property.default?.alt;
  }
  build["default"] = {
    size_type: "exact",
    src: defaultSrc,
    alt: defaultAlt,
    loading: "lazy",
    width: property.rules.dimensions?.width || 128,
    height: property.rules.dimensions?.height || 128,
    max_width: property.rules.dimensions?.max?.width || 128,
    max_height: property.rules.dimensions?.max?.width || 128,
  };
  return build;
};

export const buildIconField = (id: string, property: PropertyDefinition, parentId?: string) => {
  const build = buildPlainTextField(id, property, parentId);
  return build;
};
export default buildImageField;

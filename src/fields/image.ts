import { buildBaseField } from "./generic";
import { PropertyDefinition } from "./types";

const buildImageField = (id: string, property: PropertyDefinition) => {
  const build = buildBaseField(id, property);
  build["type"] = "image";
  build["responsive"] = true;
  build["default"] = {
    size_type: "exact",
    src: property.default.src || "",
    alt: property.default.alt || "",
    loading: "lazy",
    width: property.rules.image?.width || 128,
    height: property.rules.image?.height || 128,
    max_width: property.rules.image?.max?.width || 128,
    max_height: property.rules.image?.max?.width || 128,
  };
  return build;
};
export default buildImageField;

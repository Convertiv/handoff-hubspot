import { buildBaseField } from "./generic";
import { PropertyDefinition } from "./types";
import { ImageValue } from "./types";

const buildImageField = (id: string, property: PropertyDefinition) => {
  const build = buildBaseField(id, property);
  build["type"] = "image";
  build["responsive"] = true;
  build["default"] = {
    size_type: "exact",
    src:
      typeof property.default === "object" && "src" in property.default
        ? property.default?.src
        : "",
    alt:
      typeof property.default === "object" && "alt" in property.default
        ? property.default?.alt
        : "",
    loading: "lazy",
    width: property.rules.dimensions?.width || 128,
    height: property.rules.dimensions?.height || 128,
    max_width: property.rules.dimensions?.max?.width || 128,
    max_height: property.rules.dimensions?.max?.width || 128,
  };
  return build;
};
export default buildImageField;

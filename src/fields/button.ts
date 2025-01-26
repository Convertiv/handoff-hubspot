import { buildBaseField } from "./generic";
import { PropertyDefinition } from "./types";

const buildButtonField = (id: string, property: PropertyDefinition) => {
  const build = buildBaseField(id, property);
  build["type"] = "link";
  build["show_advanced_rel_options"] = true;
  build["display_width"] = null;
  build["default"] = {
    url: {
      content_id: "",
      type: "EXTERNAL",
      href:
        typeof property.default === "object" && "href" in property.default
          ? property.default?.href
          : "",
    },
    open_in_new_tab: false,
    no_follow: false,
  };
  return build;
};
export default buildButtonField;

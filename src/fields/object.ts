import { parseRequired, safeLabel, safeName } from "./utils";
import { PropertyDefinition } from "./types";
import { buildFields } from "./fields";

export const buildObjectGroupField = (
  id: string,
  property: PropertyDefinition
): {
  id: string;
  name: string;
  label: string;
  required: boolean;
  help_text: string;
  locked: boolean;
  allow_new_line: boolean;
  show_emoji_picker: boolean;
  type: string;
  display_width: any;
  default: any;
  children: any[];
} => {
  const group = {
    id,
    name: safeLabel(id),
    label: safeName(property.name),
    required: parseRequired(property.rules),
    help_text: property.description,
    locked: false,
    allow_new_line: false,
    show_emoji_picker: false,
    type: "group",
    display_width: null,
    default: property.default,
    children: [],
  };

  group.children = buildFields(property.properties, id);
  return group;
};

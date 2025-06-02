import { parseRequired, safeLabel, safeName } from "./utils";
import { PropertyDefinition } from "./types";
import { buildFields } from "./fields";
import buildPlainTextField from "./text";

export const buildBaseGroupField = (
  id: string,
  property: PropertyDefinition,
  parentId?: string
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
    id: `${parentId ? `${parentId}_` : ""}${id}`,
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
    occurrence: {
      min: property.rules.content?.min || 0,
      max: property.rules.content?.max || 0,
      sorting_label_field: null,
      default: property.rules.content?.min || 0,
    },
    children: [],
  };
  if (property.items.type === "object") {
    group.children = buildFields(property.items.properties, id);
  } else if (property.items.type === "text") {
    property.items.name = property.name;
    group.children = [buildPlainTextField(id, property.items)];
  }
  return group;
};

export const buildBaseField = (
  id: string,
  property: PropertyDefinition,
  groupId: string | undefined
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
  validation_message?: string;
} => {
  
  return {
    id: `${groupId ? `${groupId}_` : ""}${id}`,
    name: safeLabel(id),
    label: safeName(property.name),
    required: parseRequired(property.rules),
    help_text: property.description,
    locked: false,
    allow_new_line: false,
    show_emoji_picker: false,
    type: "text",
    display_width: null,
    default: property.default,
  };
};

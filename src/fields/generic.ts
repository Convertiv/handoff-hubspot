import { parseRequired } from "./utils";
import { v4 as uuidv4 } from "uuid";
import { PropertyDefinition } from "./types";
import { buildFields } from "./fields";

export const buildBaseGroupField = (
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
    id: `${id}_${uuidv4()}`,
    name: id,
    label: property.name,
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
  group.children = buildFields(property.items.properties);
  return group;
};

export const buildBaseField = (
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
  validation_message?: string;
} => {
  return {
    id: `${id}_${uuidv4()}`,
    name: id,
    label: property.name,
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

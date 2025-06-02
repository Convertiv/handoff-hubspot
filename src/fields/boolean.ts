import { parseRequired, safeLabel, safeName } from "./utils";
import { PropertyDefinition } from "./types";
import { buildFields } from "./fields";


export const buildBooleanField = (
    id: string,
    property: PropertyDefinition,
): {
    id: string;
    name: string;
    label: string;
    required: boolean;
    help_text: string;
    locked: boolean;
    display: string;
    show_emoji_picker: boolean;
    type: string;
    display_width: any;
    default: any;
    } => {
    const group = {
        id: `${id}`,
        name: safeLabel(id),
        label: safeName(property.name),
        required: parseRequired(property.rules),
        help_text: property.description,
        locked: false,
        display: 'checkbox',
        show_emoji_picker: false,
        type: "boolean",
        display_width: null,
        default: property.default,
    };
    return group;
};
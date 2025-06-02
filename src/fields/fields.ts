import { buildBooleanField } from "./boolean";
import buildButtonField, { buildButtonLabelField } from "./button";
import { buildBaseGroupField } from "./generic";
import buildImageField, { buildIconField } from "./image";
import { buildMenuField } from "./menu";
import { buildObjectGroupField } from "./object";
import buildSelectField from "./select";
import buildPlainTextField, {
  buildLinkTextField,
  buildNumberField,
  buildRichTextField,
} from "./text";
import buildUrlField from "./url";
import buildVideoFileField, {
  buildVideoEmbedField,
  buildVideoPosterField,
  buildVideoTitleField,
} from "./video";

/**
 * Build fields from properties
 * @param properties
 * @param parentId Optional parent ID for field naming
 * @returns
 */
export const buildFields = (properties: any, parentId?: string) => {
  const fields = [];
  Object.keys(properties).map((key: string) => {
    const property = properties[key];
    const fieldId = parentId ? `${parentId}_${key}` : key;
    switch (property.type) {
      case "boolean":
        fields.push(buildBooleanField(fieldId, property));
        break;
      case "array":
        fields.push(buildBaseGroupField(fieldId, property));
        break;
      case "object":
        fields.push(buildObjectGroupField(fieldId, property));
        break;
      case "text":
        fields.push(buildPlainTextField(fieldId, property));
        break;
      case "select":
        fields.push(buildSelectField(fieldId, property));
        break;
      case "richtext":
        fields.push(buildRichTextField(fieldId, property));
        break;
      case "image":
        fields.push(buildImageField(fieldId, property));
        break;
      case "link":
        fields.push(buildButtonField(fieldId, property));
        fields.push(buildLinkTextField(fieldId, property));
        break;
      case "icon":
        fields.push(buildIconField(fieldId, property));
        break;
      case "button":
        fields.push(buildButtonField(fieldId, property));
        fields.push(buildButtonLabelField(fieldId, property));
        break;
      case "video_file":
        fields.push(buildVideoFileField(fieldId, property));
        fields.push(buildVideoTitleField(fieldId, property));
        break;
      case "video_embed":
        fields.push(buildVideoEmbedField(fieldId, property));
        fields.push(buildVideoTitleField(fieldId, property));
        fields.push(buildVideoPosterField(fieldId, property));
        break;
      case "menu":
        fields.push(buildMenuField(fieldId, property));
        break;
      case "url":
        fields.push(buildUrlField(fieldId, property));
        break;
      case "number":
        fields.push(buildNumberField(fieldId, property));
        break;
    }
  });

  return fields.filter((field) => field != undefined && field != null);
};

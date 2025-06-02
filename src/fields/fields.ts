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
 * @returns
 */
export const buildFields = (properties: any, groupId?: string) => {
  const fields = [];
  Object.keys(properties).map((key: string) => {
    const property = properties[key];
    switch (property.type) {
      case "boolean":
        fields.push(buildBooleanField(key, property, groupId));
        break;
      case "array":
        fields.push(buildBaseGroupField(key, property, groupId));
        break;
      case "object":
        fields.push(buildObjectGroupField(key, property, groupId));
        break;
      case "text":
        fields.push(buildPlainTextField(key, property, groupId));
        break;
      case "select":
        fields.push(buildSelectField(key, property, groupId));
        break;
      case "richtext":
        fields.push(buildRichTextField(key, property, groupId));
        break;
      case "image":
        fields.push(buildImageField(key, property, groupId));
        break;
      case "link":
        fields.push(buildButtonField(key, property, groupId));
        fields.push(buildLinkTextField(key, property, groupId));
        break;
      case "icon":
        fields.push(buildIconField(key, property, groupId));
        break;
      case "button":
        fields.push(buildButtonField(key, property, groupId));
        fields.push(buildButtonLabelField(key, property, groupId));
        break;
      case "video_file":
        fields.push(buildVideoFileField(key, property, groupId));
        fields.push(buildVideoTitleField(key, property, groupId));
        break;
      case "video_embed":
        fields.push(buildVideoEmbedField(key, property, groupId));
        fields.push(buildVideoTitleField(key, property, groupId));
        fields.push(buildVideoPosterField(key, property, groupId));
        break;
      case "menu":
        fields.push(buildMenuField(key, property, groupId));
        break;
      case "url":
        fields.push(buildUrlField(key, property, groupId));
        break;
      case "number":
        fields.push(buildNumberField(key, property, groupId));
        break;
    }
  });

  return fields.filter((field) => field != undefined && field != null);
};

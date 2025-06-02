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
    switch (property.type) {
      case "boolean":
        fields.push(buildBooleanField(key, property, parentId));
        break;
      case "array":
        fields.push(buildBaseGroupField(key, property, parentId));
        break;
      case "object":
        fields.push(buildObjectGroupField(key, property, parentId));
        break;
      case "text":
        fields.push(buildPlainTextField(key, property, parentId));
        break;
      case "select":
        fields.push(buildSelectField(key, property, parentId));
        break;
      case "richtext":
        fields.push(buildRichTextField(key, property, parentId));
        break;
      case "image":
        fields.push(buildImageField(key, property, parentId));
        break;
      case "link":
        fields.push(buildButtonField(key, property, parentId));
        fields.push(buildLinkTextField(key, property, parentId));
        break;
      case "icon":
        fields.push(buildIconField(key, property, parentId));
        break;
      case "button":
        fields.push(buildButtonField(key, property, parentId));
        fields.push(buildButtonLabelField(key, property, parentId));
        break;
      case "video_file":
        fields.push(buildVideoFileField(key, property, parentId));
        fields.push(buildVideoTitleField(key, property, parentId));
        break;
      case "video_embed":
        fields.push(buildVideoEmbedField(key, property, parentId));
        fields.push(buildVideoTitleField(key, property, parentId));
        fields.push(buildVideoPosterField(key, property, parentId));
        break;
      case "menu":
        fields.push(buildMenuField(key, property, parentId));
        break;
      case "url":
        fields.push(buildUrlField(key, property, parentId));
        break;
      case "number":
        fields.push(buildNumberField(key, property, parentId));
        break;
    }
  });

  return fields.filter((field) => field != undefined && field != null);
};

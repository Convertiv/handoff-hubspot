import { buildBooleanField } from "./boolean";
import buildButtonField, { buildButtonLabelField } from "./button";
import { buildBaseGroupField } from "./generic";
import buildImageField from "./image";
import { buildMenuField } from "./menu";
import { buildObjectGroupField } from "./object";
import buildSelectField from "./select";
import buildPlainTextField, {
  buildLinkTextField,
  buildRichTextField,
} from "./text";
import buildUrlField from "./url";
import buildVideoFileField from "./video";

/**
 * Build fields from properties
 * @param properties
 * @returns
 */
export const buildFields = (properties: any) => {
  const fields = [];
  Object.keys(properties).map((key: string) => {
    const property = properties[key];
    switch (property.type) {
      case "boolean":
        fields.push(buildBooleanField(key, property));
        break;
      case "array":
        fields.push(buildBaseGroupField(key, property));
        break;
      case "object":
        fields.push(buildObjectGroupField(key, property));
        break;
      case "text":
        fields.push(buildPlainTextField(key, property));
        break;
      case "select":
        fields.push(buildSelectField(key, property));
        break;
      case "richtext":
        fields.push(buildRichTextField(key, property));
        break;
      case "image":
        fields.push(buildImageField(key, property));
        break;
      case "link":
        fields.push(buildButtonField(key, property));
        fields.push(buildLinkTextField(key, property));
        break;
      case "button":
        fields.push(buildButtonField(key, property));
        fields.push(buildButtonLabelField(key, property));
        break;
      case "video_file":
        fields.push(buildVideoFileField(key, property));
        break;
      case "menu":
        fields.push(buildMenuField(key, property));
        break;
      case "url":
        fields.push(buildUrlField(key, property));
        break;
    }
  });

  return fields.filter((field) => field != undefined && field != null);
};

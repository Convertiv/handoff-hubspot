import buildButtonField from "./button";
import { buildBaseGroupField, buildObjectGroupField } from "./generic";
import buildImageField from "./image";
import buildPlainTextField, {
  buildLinkTextField,
  buildRichTextField,
} from "./text";
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
    console.log("Property", property.type);
    switch (property.type) {
      case "array":
        fields.push(buildBaseGroupField(key, property));
        break;
      case "object":
        fields.push(buildObjectGroupField(key, property));
        break;
      case "text":
        fields.push(buildPlainTextField(key, property));
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
        fields.push(buildLinkTextField(key, property));
        break;
      case "video_file":
        fields.push(buildVideoFileField(key, property));
        break;
    }
  });

  return fields.filter((field) => field != undefined && field != null);
};

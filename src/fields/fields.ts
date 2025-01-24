import buildButtonField from "./button";
import buildImageField from "./image";
import buildPlainTextField from "./text";
import buildVideoFileField from "./video";

/**
 * Build fields from properties
 * @param properties
 * @returns
 */
export const buildFields = (properties: any) => {
  const fields = Object.keys(properties)
    .map((key: string) => {
      const property = properties[key];
      switch (property.type) {
        case "string":
          return buildPlainTextField(key, property);
        case "image":
          return buildImageField(key, property);
        case "link":
          return buildButtonField(key, property);
        case "button":
          return buildButtonField(key, property);
        case "video":
          return buildVideoFileField(key, property);
      }
    })
    .filter((field) => field != undefined && field != null);
  return fields;
};

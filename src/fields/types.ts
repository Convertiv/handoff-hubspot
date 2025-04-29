export type FieldType =
  | "text"
  | "richtext"
  | "array"
  | "object"
  | "number"
  | "checkbox"
  | "select"
  | "image"
  | "icon"
  | "button"
  | "link"
  | "url"
  | "breadcrumb"
  | "video_file"
  | "file"
  | "video_embed"
  | "pagination"
  | "boolean"
  | "search"
  | "menu"
  | "icon";

export const FieldTypes: FieldType[] = [
  "text",
  "richtext",
  "array",
  "number",
  "object",
  "checkbox",
  "select",
  "image",
  "icon",
  "button",
  "link",
  "url",
  "breadcrumb",
  "video_file",
  "file",
  "video_embed",
  "pagination",
  "boolean",
  "menu",
  "search",
  "icon",
];

export type ComponentType = "element" | "block";

export type HandoffComponent = {
  id: string;
  version: string;
  title: string;
  description: string;
  type: FieldType;
  preview: string;
  group: string;
  categories: string[];
  tags: string[];
  code: string;
  css: string;
  js: string;
  jsCompiled?: string;
  previews: { [key: string]: PreviewDefinition };
  properties: { [key: string]: PropertyDefinition };
};

export type HandoffComponentListResponse = HandoffComponent[];

export type HandoffComponentResponse = HandoffComponent;

export interface PreviewDefinition {
  title: string;
  values: { [key: string]: ValueDefinition };
}

export type ValueDefinition =
  | ImageValue
  | string
  | boolean
  | number
  | ImageValue
  | ButtonValue
  | BreadCrumbValue[]
  | LinkValue
  | VideoValue;

export interface ImageValue {
  src: string;
  alt: string;
}

export interface ImageValue {
  src: string;
  alt: string;
}

export interface VideoValue {
  src: string;
  title: string;
  poster: {
    src: string;
    alt: string;
  };
}

export interface ButtonValue {
  label: string;
  url: string;
  active?: boolean;
  rel?: string;
  target?: string;
  metadata?: "";
}

export interface LinkValue {
  text: string;
  href: string;
}

export interface BreadCrumbValue {
  label: string;
  url: string;
  active: boolean;
  rel?: string;
  target?: string;
  metadata?: "";
}
[];

export interface PropertyDefinition {
  name: string;
  type: FieldType;
  description: string;
  rules: RulesDefinition;
  default: ValueDefinition;
  properties?: { [key: string]: PropertyDefinition };
  items?: PropertyDefinition;
  options?:
    | {
        value: string;
        label: string;
      }[]
    | string[];
}

export interface RulesDefinition {
  required?: boolean;
  dimensions?: {
    width?: number;
    height?: number;
    min: {
      width: number;
      height: number;
    };
    max?: {
      width: number;
      height: number;
    };
    recommend?: {
      width: number;
      height: number;
    };
  };
  filesize?: number;
  content?: {
    min: number;
    max: number;
    prefix?: string;
    suffix?: string;
  };
  pattern?: string;
}

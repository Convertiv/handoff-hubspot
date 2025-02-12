export type FieldType =
  | "text"
  | "richtext"
  | "array"
  | "object"
  | "number"
  | "checkbox"
  | "select"
  | "image"
  | "button"
  | "link"
  | "breadcrumb"
  | "video_file"
  | "file"
  | "video_embed";

export const FieldTypes: FieldType[] = [
  "text",
  "richtext",
  "array",
  "number",
  "object",
  "checkbox",
  "select",
  "image",
  "button",
  "link",
  "breadcrumb",
  "video_file",
  "file",
  "video_embed",
];

export type ComponentType = "element" | "block";

export type HandoffComponent = {
  id: string;
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
  | LinkValue;

export interface ImageValue {
  src: string;
  alt: string;
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
  items?: {
    type: FieldType;
    properties: { [key: string]: PropertyDefinition };
  };
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
  };
  pattern?: string;
}

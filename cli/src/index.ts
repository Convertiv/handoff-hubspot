import axios from "axios";
import fs from "fs";
import transpile from "./transpile";
import yargs from "yargs";
import * as prettier from "prettier";
import path from "path";

const url = "https://stage-ssc.handoff.com/api/";
const headers = {
  "Content-Type": "application/json",
};
const request = axios.create({
  baseURL: url,
  headers,
});

/**
 * Fetch shared styles from handoff api
 */
const fetchSharedStyles: () => Promise<void> = async () => {
  try {
    const response = await request.get("component/shared.css");
    writeToFile(response.data, `shared.css`);
  } catch (e) {
    console.error(e);
  }
};

/**
 * Fetch component from handoff api
 * @param componentId
 * @returns Object
 */
const fetchComponent: (
  componentId: string
) => Promise<HandoffComponentResponse> = async (componentId: string) => {
  try {
    const response = await request.get(`component/${componentId}.json`);
    // Parse response and create a web component from response
    return response.data;
  } catch (e) {
    console.error(e);
  }
};

type HandoffComponent = {
  id: string;
  title: string;
  description: string;
  code: string;
  css: string;
  js: string;
  properties: any;
  tags: string[];
};

type HandoffComponentResponse = {
  latest: HandoffComponent;
  [key: string]: HandoffComponent;
};

const buildMeta = (component: HandoffComponent) => {
  const metadata = {
    label: component.title,
    css_assets: [],
    external_js: [],
    global: true,
    help_text: component.description,
    content_types: ["PAGE"],
    js_assets: [],
    other_assets: [],
    smart_type: "NOT_SMART",
    tags: component.tags,
  };
};

/**
 * Build a web component from a handoff component
 * @param componentId
 * @returns
 */
const buildModule = async (componentId: string) => {
  const data = await fetchComponent(componentId);
  const component = data.latest;
  const template = transpile(component.code);
  const pretty = await prettier.format(template, { parser: "html" });
  writeToFile(pretty, `${componentId}/module.html`);
  writeToFile(component.css, `${componentId}/module.css`);
  writeToFile(component.js, `${componentId}/module.js`);
  writeToFile(JSON.stringify(buildMeta(component)), `${componentId}/meta.json`);
  writeToFile(
    JSON.stringify(buildFields(component.properties), null, 2),
    `${componentId}/fields.json`
  );
  return template;
};

/**
 * Transform the handoff type to a hubspot component type
 * @param type
 * @returns
 */
const transformType: (type: string) => string = (type: string) => {
  switch (type) {
    case "string":
      return "text";
    case "number":
      return "number";
    case "boolean":
      return "checkbox";
    case "array":
      return "select";
    default:
      return "text";
  }
};

/**
 * Map the default value to a hubspot component default
 * @param property
 * @returns
 */
const transformDefault = (property: any) => {
  if (property.default) {
    if (property.type === "image") {
      return {
        src: property.default,
      };
    }
    return property.default;
  }
  return null;
};

/**
 * Build fields from properties
 * @param properties
 * @returns
 */
const buildFields = (properties: any) => {
  console.log(properties);
  const fields = Object.keys(properties).map((key: string) => {
    const property = properties[key];
    let map = {
      label: property.title,
      name: property.id,
      type: transformType(property.type),
      locked: false,
      responsive: true,
      resizable: true,
      required: property.rules?.required
        ? Boolean(property.rules.required)
        : false,
      default: transformDefault(property),
    };
    if (property.rules?.pattern) {
      map["validation_regex"] = property.rules.pattern;
    }
    return map;
  });
  return fields;
};

/**
 * Write a file to the file system
 * @param template
 * @param id
 */
const writeToFile = async (template: string, id: string) => {
  // ensure dir exists
  if (!fs.existsSync("components")) {
    fs.mkdirSync("components");
  }
  const dirName = path.dirname(id);
  // ensure dir exists
  if (!fs.existsSync(`components/${dirName}`)) {
    fs.mkdirSync(`components/${dirName}`);
  }
  fs.writeFile(`components/${id}`, template, (err: any) => {
    if (err) {
      console.error(err);
    }
  });
};

/**
 * Handle command line arguments
 */
const main = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage("Usage: $0 <componentId>")
    .demandCommand(1)
    .help().argv;

  const componentId = argv._[0];
  fetchSharedStyles();
  await buildModule(componentId);
};

main();

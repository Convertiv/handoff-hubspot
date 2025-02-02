#!/usr/bin/env node
import axios from "axios";
import fs from "fs";
import transpile from "./transpile";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import * as prettier from "prettier";
import path, { parse } from "path";
import { createConfigCommand, readConfig } from "./config/command";
import { buildFields } from "./fields/fields";
import validateModule from "./validate";
import { HandoffComponent, HandoffComponentResponse } from "./fields/types";

const init = async () => {
  const config = readConfig();
  const url = config.url;
  const headers = {
    "Content-Type": "application/json",
  };
  const request = axios.create({
    baseURL: url,
    headers,
  });
  return request;
};

/**
 * Fetch shared styles from handoff api
 */
const fetchSharedStyles: () => Promise<void> = async () => {
  const request = await init();
  try {
    const response = await request.get("component/shared.css");
    writeSharedCss(response.data, `uds.css`);
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
    const request = await init();
    const response = await request.get(`component/${componentId}.json`);
    // Parse response and create a web component from response
    return response.data;
  } catch (e) {
    console.error(e);
  }
};



const buildMeta = (component: HandoffComponent) => {
  const metadata = {
    label: component.title,
    css_assets: [],
    external_js: [],
    global: false,
    help_text: component.description,
    content_types: ["ANY"],
    js_assets: [],
    other_assets: [],
    smart_type: "NOT_SMART",
    tags: [], //component.tags,
  };
  return metadata;
};


/**
 * Build a web component from a handoff component
 * @param componentId
 * @returns
 */
const buildModule = async (componentId: string, force: boolean) => {
  const data = await fetchComponent(componentId);
  const component = data.latest;
  // Validate the component
  const errors = validateModule(component);
  if(errors.length > 0) {
    console.error("Validation failed with these errors.  You may override and force a build with the force option, using --force", errors);
    return;
  }

  const template = transpile(component.code, component.properties);
  
  const pretty = await prettier.format(template, {
    parser: "jinja-template",
    plugins: ["prettier-plugin-jinja-template"],
  });
  writeToModuleFile(pretty, component.title, `module.html`);
  writeToModuleFile(component.css, component.title, `module.css`);
  if (!component.js) component.js = "/**\n * This file is blank\n */";
  writeToModuleFile(component.js, component.title, `module.js`);
  writeToModuleFile(
    JSON.stringify(buildMeta(component), null, 2),
    component.title,
    `meta.json`
  );
  writeToModuleFile(
    JSON.stringify(buildFields(component.properties), null, 2),
    component.title,
    `fields.json`
  );
  return template;
};

/**
 * Write a file to the file system
 * @param template
 * @param id
 */
const writeToModuleFile = async (
  template: string,
  component: string,
  name: string
) => {
  // ensure dir exists
  const config = readConfig();
  let filename = `${config.modulePrefix}${component}`;
  filename = filename
    .replace(/[^a-zA-Z0-9]/g, " ")
    // remove double spaces
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  const targetPath = `${config.modulesPath}/${filename}.module`;
  console.log("Writing module to ", targetPath);
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }
  if (template) {
    fs.writeFile(`${targetPath}/${name}`, template, (err: any) => {
      if (err) {
        console.error(err);
      }
    });
  } else {
    console.error("No template found for ", name);
  }
};

/**
 * Write a file to the file system
 * @param template
 * @param id
 */
const writeSharedCss = async (template: string, name: string) => {
  // ensure dir exists
  const config = readConfig();
  const targetPath = config.cssPath;
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }
  if (template) {
    fs.writeFile(`${targetPath}/${name}`, template, (err: any) => {
      if (err) {
        console.error(err);
      }
    });
  } else {
    console.error("No template found for ", name);
  }
};

/**
 * Handle command line arguments
 */
const main = async () => {
  const argv = yargs(hideBin(process.argv))
    .command({
      command: "config",
      describe: "Build the handoff config",
      handler: async () => {
        createConfigCommand();
      },
    })
    .command({
      command: "styles",
      describe: "Fetch shared styles from handoff",
      handler: async () => {
        fetchSharedStyles();
      },
    })
    .command({
      command: "fetch [component]",
      describe: "Fetch a component and transform it to a hubspot component",
      // add an optional force
      builder: (yargs) => {
        return yargs.option("force", {
          alias: "f",
          description: "Force the build",
          type: "boolean",
        });
      },
      handler: async (parsed) => {
        console.log("Fetching component", parsed.component);
        await buildModule(parsed.component, parsed.force);
      },
    })
    .command({
      command: "validate [component]",
      describe: "Read the component and validate it",
      handler: async (parsed) => {
        console.log("Validating component", parsed.component);
        const data = await fetchComponent(parsed.component);
        const component = data.latest;
        const errors = validateModule(component);
        if(errors.length > 0) {
          console.error("Validation failed", errors);
        } else {
          console.log("Validation passed");
        }
      },
    })
    .help()
    .parse();
};

main();

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
import { formatErrors, validateAll, validateModule } from "./validate";
import {
  HandoffComponent,
  HandoffComponentListResponse,
  HandoffComponentResponse,
} from "./fields/types";
import validateComponent from "./validate";
import chalk from "chalk";

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
export const fetchComponent: (
  componentId: string
) => Promise<HandoffComponentResponse> = async (componentId: string) => {
  try {
    const request = await init();
    const response = await request.get(`component/${componentId}/latest.json`);
    // Parse response and create a web component from response
    return response.data;
  } catch (e) {
    console.error(e);
  }
};

/**
 * Fetch component from handoff api
 * @param componentId
 * @returns Object
 */
export const fetchComponentList: () => Promise<HandoffComponentListResponse> =
  async () => {
    try {
      const request = await init();
      const response = await request.get(`components.json`);
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
    content_types: [
      "LANDING_PAGE",
      "KNOWLEDGE_BASE",
      "QUOTE_TEMPLATE",
      "LANDING_PAGE",
      "SITE_PAGE",
      "CUSTOMER_PORTAL",
      "BLOG_LISTING",
      "WEB_INTERACTIVE",
      "BLOG_POST",
      "MEMBERSHIP",
    ],
    js_assets: [],
    other_assets: [],
    smart_type: "NOT_SMART",
    categories: component.tags,
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
  const component = data;
  // Validate the component
  const errors = validateModule(component);
  if (errors.length > 0) {
    console.error(
      `Validation failed with these errors.  You may override and force a build with the force option, using --force\n\n`,
      formatErrors(errors)
    );
    if (!force) {
      return;
    } else {
      console.log(
        chalk.green("\n---- Force Mode on. Building module with errors ----\n")
      );
    }
  }

  const template = transpile(component.code, component.properties);

  const pretty = await prettier.format(template, {
    parser: "jinja-template",
    plugins: ["prettier-plugin-jinja-template"],
  });
  writeToModuleFile(pretty, component.title, `module.html`);
  writeToModuleFile(component.css, component.title, `module.css`);
  if (!component.jsCompiled) component.js = "/**\n * This file is blank\n */";
  writeToModuleFile(component.jsCompiled, component.title, `module.js`);
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
  console.log(chalk.green(`Writing ${name} to ${targetPath}`));
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
        console.log(`-- Fetching component ${parsed.component}---\n`);
        await buildModule(parsed.component, parsed.force);
      },
    })
    .command({
      command: "validate [component]",
      describe: "Read the component and validate it",
      handler: async (parsed) => {
        console.log("Validating component", parsed.component);
        validateComponent(parsed.component);
      },
    })
    .command({
      command: "validate:all",
      describe: "Pull a list of all components and validate them",
      handler: async (parsed) => {
        console.log("Validating all component");
        validateAll();
      },
    })
    .command({
      command: "fetch:all",
      describe: "Fetch and build all components",
      handler: async (parsed) => {
        console.log("Validating all component");
        console.log(chalk.yellow("This command is not yet implemented"));
      },
    })

    .help()
    .parse();
};

main();

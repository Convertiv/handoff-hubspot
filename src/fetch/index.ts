import chalk from "chalk";
import { formatErrors, validateAll, validateModule } from "../validate/index.js";
import { fetchComponent, fetchComponentList, fetchComponentJs } from "../index.js";
import transpile from "../transpile.js";
import * as prettier from "prettier";
import { HandoffComponent } from "../fields/types.js";
import { readConfig } from "../config/command.js";
import fs from "fs";
import { buildFields } from "../fields/fields.js";
import { processHubdbMappings } from "../fields/hubdb.js";

const buildMeta = (component: HandoffComponent) => {
  const config = readConfig();
  let global = false;
  if (component.group === "Navigation") {
    global = true;
  }
  const metadata = {
    label: config.modulePrefix + " " + component.title,
    css_assets: [],
    external_js: [],
    global,
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
    categories: component.categories,
    tags: component.tags,
  };
  return metadata;
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
  let filename = `${component}`;
  filename = filename.replace(/[^a-zA-Z0-9]/g, "-");
  const targetPath = `${config.modulesPath}/${filename}.module`;
  console.log(chalk.green(` - Writing ${name} to ${targetPath}`));
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
export const writeSharedCss = async (template: string, name: string) => {
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
 * Write a file to the file system
 * @param template
 * @param id
 */
export const writeSharedJs = async (template: string, name: string) => {
  // ensure dir exists
  const config = readConfig();
  const targetPath = config.jsPath;
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
 * Build a web component from a handoff component
 * @param componentId
 * @returns
 */
const buildModule = async (componentId: string, force: boolean) => {
  const config = readConfig();
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

  const template = transpile(component.code, component.properties, config, componentId);
  let pretty = template;
  try {
    pretty = await prettier.format(template, {
      parser: "jinja-template",
      plugins: ["prettier-plugin-jinja-template"],
    });
  } catch (e) {
    console.error(
      chalk.yellow("Error formatting template " + component.id),
      e.message
    );
  }

  // Prettier enforces double quotes on html attributes, which breaks JSON payloads formatting inside HubL.
  // Any attribute string containing |tojson will have its double quotes converted back to single quotes.
  pretty = pretty.replace(/(\w+(?:-\w+)*)="([^"]*\|tojson[^"]*)"/g, "$1='$2'");

  const url = new URL(config.url);

  const header = {
    title: component.title,
    description: component.description,
    group: component.group,
    version: component.version,
    last_updated: new Date().toISOString(),
    link: `${url.origin}/system/component/${component.id}`,
  };
  pretty =
    `{#\n  ` +
    Object.keys(header)
      .map((key) => `${key}: ${header[key]}`)
      .join("\n  ") +
    `\n#}` +
    "\n\n" +
    pretty;
  writeToModuleFile(pretty, componentId, `module.html`);
  let css;
  if (!config.moduleCSS && (!config.componentCSS || !config.componentCSS.includes(componentId))) {
    css = "/**\n * We are using the core compiled css. This file is blank \n */";
  } else {
    css = component.css;
  }
  writeToModuleFile(css, componentId, `module.css`);

  let js;
  if (!config.moduleJS && (!config.componentJS || !config.componentJS.includes(componentId))) {
    js = "/**\n * We are using the core compiled JS. This file is blank \n */";
  } else {
    // attempt to fetch js from the api
    const jsData = await fetchComponentJs(componentId);
    if (!jsData) {
      js = "/**\n * This file is blank\n */";
    } else {
      js = jsData;
    }
  }
  writeToModuleFile(js, componentId, `module.js`);
  writeToModuleFile(
    JSON.stringify(buildMeta(component), null, 2),
    componentId,
    `meta.json`
  );
  const baseFields = buildFields(component.properties);
  const processedFields = processHubdbMappings(baseFields, config, componentId);

  writeToModuleFile(
    JSON.stringify(processedFields, null, 2),
    componentId,
    `fields.json`
  );
  return template;
};



export const fetchAll = async (force: boolean) => {
  try {
    await validateAll();
  } catch (e) {
    if (force) {
      console.log(chalk.red("Validation failed, but forcing build"));
    } else {
      console.log(chalk.red("Validation failed. Use --force to force build"));
      return;
    }
  }

  const data = await fetchComponentList();
  for (const component of data) {
    console.log(chalk.blue(`\nBuilding ${component.title}`));
    // validate the component
    try {
      await buildModule(component.id, force);
    } catch (e) {
      console.error(`Error building ${component.title}`, e);
    }
  }
};

export default buildModule;

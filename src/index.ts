#!/usr/bin/env node
import axios from "axios";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { createConfigCommand, readConfig } from "./config/command";
import { validateAll } from "./validate";
import {
  HandoffComponentListResponse,
  HandoffComponentResponse,
} from "./fields/types";
import validateComponent from "./validate";
import chalk from "chalk";
import buildModule, { fetchAll, writeSharedCss, writeSharedJs } from "./fetch";

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
  if (config.username && config.password) {
    request.defaults.auth = {
      username: config.username,
      password: config.password,
    };
  }
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
 * Fetch shared styles from handoff api
 */
const fetchSharedScripts: () => Promise<void> = async () => {
  const request = await init();
  try {
    // get config
    const config = readConfig();
    if (config.moduleJS) {
      console.log("Module JS is enabled, skipping shared js");
      return;
    }
    const response = await request.get("component/main.js");
    writeSharedJs(response.data, `uds.js`);
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
    // check the response code
    if (response.status !== 200) {
      console.error("Component not found");
      return null;
    }
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

const open = (url: string) => {
  const start =
    process.platform == "darwin"
      ? "open"
      : process.platform == "win32"
        ? "start"
        : "xdg-open";
  require("child_process").exec(start + " " + url);
};

const openDocs = async (componentId: string) => {
  const config = readConfig();
  // check to see if the component exists
  const component = await fetchComponent(componentId);
  if (!component) {
    console.error("Component not found");
    return;
  }
  const url = config.url;
  open(`${url}../system/component/${componentId}`);
};

const listComponents = async () => {
  const data = await fetchComponentList();
  const components = data;
  const table = [];

  components.forEach((component) => {
    table.push({
      id: component.id,
      title: component.title,
      description: component.description.substring(0, 50),
      // @ts-ignore
      "latest version": component.version,
    });
  });
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
        console.log(`-- Fetching shared component css ---\n`);
        fetchSharedStyles();
      },
    })
    .command({
      command: "scripts",
      describe: "Fetch shared scripts from handoff",
      handler: async () => {
        console.log(`-- Fetching shared component js ---\n`);
        fetchSharedScripts();
      },
    })
    .command({
      command: "list",
      describe: "List the components available in handoff",
      handler: async (parsed) => {
        console.log(`-- List all Components---\n`);
        await listComponents();
      },
    })
    .command({
      command: "docs [component]",
      describe: "Open the documentation page for a component",

      handler: async (parsed) => {
        console.log(`-- Opening component ${parsed.component}---\n`);
        await openDocs(parsed.component);
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
      builder: (yargs) => {
        return yargs.option("force", {
          alias: "f",
          description: "Force the build",
          type: "boolean",
        });
      },
      handler: async (parsed) => {
        console.log("Validating all component");
        fetchAll(parsed.force);
      },
    })

    .help()
    .parse();
};

main();

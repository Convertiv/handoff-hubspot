import fs from "fs";
import prompts from "prompts";
export interface AppConfig {
  version: string;
  url: string;
  cssPath: string;
  jsPath: string;
  moduleJS: boolean;
  modulesPath: string;
  modulePrefix: string;
  username: string;
  password: string;
  fields: {
    [key: string]: {
      properties: {
        [key: string]: {
          id: string;
          type: string;
          label: string;
          description: string;
        };
      };
    };
  };
}

const defaultConfig: AppConfig = {
  version: "0.0.1",
  url: "https://stage-ssc.handoff.com/api/",
  cssPath: "css/uds.css",
  jsPath: "js/uds.js",
  moduleJS: false,
  modulesPath: "modules",
  modulePrefix: "UDS: ",
  username: "",
  password: "",
  fields: {
    image: {
      properties: {
        src: {
          id: "src",
          type: "string",
          label: "Source",
          description: "The source of the image",
        },
        alt: {
          id: "alt",
          type: "string",
          label: "Alt",
          description: "The alt text of the image",
        },
      },
    },
    button: {
      properties: {
        label: {
          id: "label",
          type: "string",
          label: "Label",
          description: "The label of the button",
        },
        url: {
          id: "url",
          type: "string",
          label: "URL",
          description: "The URL of the button",
        },
      },
    },
    link: {
      properties: {
        text: {
          id: "text",
          type: "string",
          label: "Text",
          description: "The text of the link",
        },
        href: {
          id: "href",
          type: "string",
          label: "URL",
          description: "The URL of the link",
        },
      },
    },
  },
};

export const createConfigCommand = async () => {
  // does the config file exist?
  if (fs.existsSync("handoff.config.json")) {
    const overwrite = await prompts({
      type: "confirm",
      name: "value",
      message: "Config file already exists, overwrite?",
    });
    if (!overwrite.value) {
      return;
    }
  }
  // Ask for the url
  const url = await prompts({
    type: "text",
    name: "value",
    message: "What is the url of the Handoff API?",
    initial: defaultConfig.url,
  });
  // Ask for the css path
  const cssPath = await prompts({
    type: "text",
    name: "value",
    message: "Where should the shared css be saved?",
    initial: defaultConfig.cssPath,
  });
  // Ask for the css path
  const jsPath = await prompts({
    type: "text",
    name: "value",
    message: "Where should the shared js be saved?",
    initial: defaultConfig.jsPath,
  });
  const moduleJS = await prompts({
    type: "confirm",
    name: "value",
    message:
      "Should we pull js for individual modules, or use the centrally packaged js?",
    initial: defaultConfig.moduleJS,
  });
  // Ask for the modules path
  const modulesPath = await prompts({
    type: "text",
    name: "value",
    message: "Where should the modules be saved?",
    initial: defaultConfig.modulesPath,
  });
  const modulePrefix = await prompts({
    type: "text",
    name: "value",
    message: "Do you want to provide a prefix for the modules?",
    initial: defaultConfig.modulePrefix,
  });
  const authRequired = await prompts({
    type: "confirm",
    name: "value",
    message: "Does the handoff site require authentication?",
    initial: false,
  });
  let username = { value: "" };
  let password = { value: "" };
  if (authRequired.value) {
    // get the username and password
    username = await prompts({
      type: "text",
      name: "value",
      message: "What is your username?",
    });
    password = await prompts({
      type: "password",
      name: "value",
      message: "What is your password?",
    });
  }
  const handoffConfig = {
    ...defaultConfig,
    url: url.value,
    cssPath: cssPath.value,
    jsPath: jsPath.value,
    moduleJS: moduleJS.value,
    modulesPath: modulesPath.value,
    modulePrefix: modulePrefix.value,
    username: username.value,
    password: password.value,
  };
  fs.writeFile(
    "handoff.config.json",
    JSON.stringify(handoffConfig, null, 2),
    (err: any) => {
      if (err) {
        console.error(err);
      }
    }
  );
};

/**
 * Fetch the config file and return the object
 * @returns Object
 */
export const readConfig = () => {
  if (fs.existsSync("handoff.config.json")) {
    const config = fs.readFileSync("handoff.config.json", "utf-8");
    return JSON.parse(config);
  }
  return defaultConfig;
};

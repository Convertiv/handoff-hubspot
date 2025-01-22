import fs from "fs";
import prompts from "prompts";
const defaultConfig = {
  version: "0.0.1",
  url: "https://stage-ssc.handoff.com/api/",
  cssPath: "css/uds.css",
  modulesPath: "modules",
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
    message: "Where should the css be saved?",
    initial: defaultConfig.cssPath,
  });
  // Ask for the modules path
  const modulesPath = await prompts({
    type: "text",
    name: "value",
    message: "Where should the modules be saved?",
    initial: defaultConfig.modulesPath,
  });
  const handoffConfig = {
    ...defaultConfig,
    url: url.value,
    cssPath: cssPath.value,
    modulesPath: modulesPath.value,
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

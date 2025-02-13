import { RulesDefinition } from "./types";

export const parseRequired = (rules: RulesDefinition) => {
  return rules?.required ? Boolean(rules.required) : false;
};

export const safeLabel = (label: string) => {
  if (label === "label") {
    return "field_label";
  }
  return label.replace(/[^a-zA-Z0-9_]/g, "_");
};

export const safeName = (name: string) => {
  if (name.toLocaleLowerCase() === "label") {
    return "Field Label";
  }
  return name;
};

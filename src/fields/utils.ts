import { RulesDefinition } from "./types";

export const parseRequired = (rules: RulesDefinition) => {
  return rules?.required ? Boolean(rules.required) : false;
};

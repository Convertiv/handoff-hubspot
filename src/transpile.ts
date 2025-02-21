import Handlebars from "handlebars";
import { PropertyDefinition } from "./fields/types";

const iterator: string[] = [];
let properties: { [key: string]: PropertyDefinition } = {};
let chain: PropertyDefinition[] = [];
let currentProperty: PropertyDefinition | null = null;
let parentProperty: PropertyDefinition | null = null;
let field;

/**
 * Transpile handlebars code to hubspot code
 * @param code string
 * @returns string
 */
const transpile: (
  code: string,
  props?: { [key: string]: PropertyDefinition }
) => string = (code, props) => {
  const parsed = Handlebars.parse(code);
  if (props) properties = props;
  return program(parsed);
};

/**
 * Transpile handlebars block to hubspot block
 * @param node
 * @returns
 */
const block = (node) => {
  const variableList: string[] = node.params[0].original.split(".");
  let variable = variableList[variableList.length - 1];
  let returnValue;
  switch (node.path.original) {
    case "field":
      // figure out if what the field type is
      returnValue = `{# field ${node.params[0].value} #}\n${program(node.program)}`;
      break;
    case "if":
      let target = "module";
      let findProperty;
      // ask if the variable is a property
      if (properties[variable]) {
        findProperty = properties[variable];
        if (findProperty.type === "link") {
          variableList[variableList.length - 1] = `${variable}_text`;
        } else if (
          findProperty.type === "button" ||
          findProperty.type === "breadcrumb"
        ) {
          variableList[variableList.length - 1] = `${variable}_text`;
        }
      }
      if (iterator.length > 0) {
        target = iterator[iterator.length - 1];
        // if (field) {
        //   target += `.${field}`;
        // }
      }
      variable = variableList
        .slice(1)
        .filter((variable) => variable !== null)
        .join(".");

      // check to see if the block has an else block
      if (node.inverse) {
        returnValue = `{% if ${target}.${variable} %} ${program(node.program)} {% else %} \`${program(node.inverse)} {% endif %}`;
      } else {
        returnValue = `{% if ${target}.${variable} %} ${program(node.program)} {% endif %}`;
      }
      break;
    case "each":
      // check if the variable is a property
      if (properties[variable]) {
        currentProperty = properties[variable];
        chain.push(currentProperty);
        field = variable;
      }
      const current = variable[0];
      let loop_target = "module";
      if (iterator.length > 0) {
        loop_target = iterator[iterator.length - 1];
      }
      variable = variableList
        .slice(1)
        .filter((variable) => variable !== null)
        .join(".");
      iterator.push(`item_${current}`);
      returnValue = `{% for item_${current} in ${loop_target}.${variable} %} ${program(node.program)} {% endfor %}`;
      if (currentProperty) {
        chain.pop();
        currentProperty = chain[chain.length - 1];
        field = undefined;
      }
      iterator.pop();
      break;
  }
  if (!returnValue)
    throw new Error(`Unknown block type: '${node.path.original}'`);
  return returnValue;
};

// Metadata builder
const metadata = (part: string) => {
  // lets see what current property we're looking at
  if (currentProperty) {
    // TODO: add more metadata properties
  }
};

const findPart = (part: string, parent: PropertyDefinition | undefined) => {
  let current;
  if (parent && (parent.type === "object" || parent.type === "array")) {
    if (parent.properties) {
      current = parent.properties[part];
    } else if (parent.items?.properties) {
      current = parent.items.properties[part];
    }
  } else {
    current = properties[part];
  }
  return current;
};

const mustache = (node) => {
  // check if the value is a variable or a string
  // @ts-ignore
  let value = node.path.original,
    lookup;

  if (value === "this") {
    value = `${iterator[iterator.length - 1]}.${field}`;
  } else {
    if (value.includes("../properties.")) {
      value = value.replace("../properties.", "properties.");
    }
    const valueParts = value.split(".");
    for (let part of valueParts) {
      lookup = findPart(part, parentProperty);
      if (lookup) {
        parentProperty = lookup;
        field = part;
      }
      // the field name can not be = label
      if (part === "this") {
        // We're in a loop, so current prop is already set to the thing we're looping over
        value = iterator[iterator.length - 1]; // get the last item in the iterator
        parentProperty = currentProperty;
      } else if (part === "properties") {
        value = "module";
      } else {
        if (value === "metadata") {
          // This is a special case where we're looking for a property on the metadata object
          value = metadata(part);
        } else {
          if (!parentProperty) {
            value += `.${part}`;
          } else if (
            parentProperty.type === "link" ||
            parentProperty.type === "button" ||
            parentProperty.type === "breadcrumb"
          ) {
            if (part === "label" || part === "text") {
              value += `.${field}_text`;
            } else if (part === "href" || part === "url") {
              value += `.${field}_url.href|escape_attr`;
            } else if (part === "rel") {
              value += `.${field}.rel|escape_attr`;
            }
          } else if (parentProperty.type === "url") {
            value += `.${field}.href|escape_attr`;
          } else {
            value += `.${part}`;
          }
        }
      }
    }
  }

  return `{{ ${value} }}`;
};

/**
 * Transpile handlebars program to hubspot code
 * @param program hbs.AST.Program
 * @returns string
 */
export const program: (program: hbs.AST.Program) => string = (program) => {
  const buffer = [];
  for (let node of program.body) {
    switch (node.type) {
      case "Program":
        // recursively call the program function
        // @ts-ignore - we know this is a program, and apparently the AST program type is wonky
        buffer.push(program(node));
      case "MustacheStatement":
        buffer.push(mustache(node));
        break;
      case "TextNode":
        // @ts-ignore
        buffer.push(node.chars);
        break;
      case "ContentStatement":
        // @ts-ignore
        buffer.push(node.value);
        break;
      case "BlockStatement":
        buffer.push(block(node));
        break;
      default:
        throw new Error(`Unknown node type`);
    }
  }
  return buffer.join("");
};

export default transpile;

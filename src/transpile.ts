import Handlebars from "handlebars";
import { PropertyDefinition } from "./fields/types";
import { v4 as uuidv4 } from "uuid";
const iterator: string[] = [];
let properties: { [key: string]: PropertyDefinition } = {};
let chain: PropertyDefinition[] = [];
let currentProperty: PropertyDefinition | null = null;
let parentProperty: PropertyDefinition | null = null;
let field;
let inMenuContext;

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
      let parentTarget = "module";
      if (iterator.length > 0) {
        parentTarget = iterator[iterator.length - 1];
      }
      let formatValue = `{# field ${node.params[0].original}`;
      // figure out if what the field type is
      // get the parent
      let first = variableList[0];

      let parentProperty = properties[first];
      if (variableList.length > 1) {
        // iterate starting from the second item in the list
        for (let i = 1; i < variableList.length; i++) {
          let part = variableList[i];
          if (parentProperty) {
            if (parentProperty.type === "array") {
              parentProperty = parentProperty.items.properties[part];
            } else if (parentProperty.type === "object") {
              parentProperty = parentProperty.properties[part];
            }
          }
        }
      }
      if (parentProperty) {
        formatValue += ` type="${parentProperty.type}"  #}`;
        if (parentProperty.type === "menu") {
          variable = variableList
            // Trim off the front if we're dropping an interator in
            .slice(iterator.length)
            .filter((variable) => variable !== null)
            .join(".");
          let context = `menu_${uuidv4().substring(1, 6)}`;
          formatValue += `\n{% set ${context} = menu(${parentTarget}.${variable}) %}`;
          inMenuContext = context;
        }
      }

      returnValue = `${formatValue}\n${program(node.program)}{# end field #}`;
      break;
    case "if":
      let target = "module";
      let findProperty = findParent(variableList);
      // ask if the variable is a property
      if (findProperty) {
        if (findProperty.type === "link") {
          variableList[variableList.length - 2] =
            `${findProperty.id}_${variable}`;
          variableList[variableList.length - 1] = "href";
        } else if (
          findProperty.type === "button" ||
          findProperty.type === "breadcrumb"
        ) {
          // We're checking to see if a button href is set
          if (findProperty.id !== variable) {
            variableList[variableList.length - 2] =
              `${findProperty.id}_${variable}`;
            variableList[variableList.length - 1] = "href";
          } else {
            variableList[variableList.length - 1] = `${findProperty.id}_url`;
            variableList.push("href");
          }
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
        returnValue = `{% if ${target}.${variable} %} ${program(node.program)} {% else %} ${program(node.inverse)} {% endif %}`;
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
      if (inMenuContext) {
        returnValue = `{% for item_${current} in ${inMenuContext}.children %} `;
        // ENsure that menu context is destroyed so it doesn't polute down the tree
        inMenuContext = undefined;
        returnValue += `${program(node.program)} {% endfor %}`;
      } else {
        returnValue = `{% for item_${current} in ${loop_target}.${variable} %} ${program(node.program)} {% endfor %}`;
      }
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
  if (parent) {
    if (parent.type === "object" || parent.type === "array") {
      if (parent.properties) {
        current = parent.properties[part];
      } else if (parent.items?.properties) {
        current = parent.items.properties[part];
      }
    } else if (
      parent.type === "link" ||
      parent.type === "button" ||
      parent.type === "breadcrumb" ||
      parent.type === "image"
    ) {
      current = parent;
    } else if (parent.type === "video_embed") {
      console.log("FOUND VIDEO EMBED");
    } else {
      current = properties[part];
    }
  } else {
    current = properties[part];
  }
  return current;
};

const findParent = (parts: string[]) => {
  let parent;
  for (let part of parts) {
    if (part === "properties") {
    } else {
      parent = findPart(part, parent);
    }
  }
  return parent;
};

const mustache = (node) => {
  // check if the value is a variable or a string
  // @ts-ignore
  let value = node.path.original,
    lookup;

  if (value === "this") {
    value = `${iterator[iterator.length - 1]}.${field}`;
  } else if (value === "@index") {
    value = `loop.index`;
  } else {
    if (value.includes("../properties.")) {
      value = value.replace("../properties.", "properties.");
    }
    const valueParts = value.split(".");
    const parentLookup = findParent(valueParts);
    for (let part of valueParts) {
      lookup = findPart(part, parentProperty);
      if (lookup) {
        parentProperty = lookup;
        // @ts-ignore
        field = parentProperty.id;
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
          } else if (parentProperty.type === "video_embed") {
            if (part === "poster") {
              value += `_poster`;
            } else {
              value += `.${field}`;
            }
          } else {
            value += `.${part}`;
          }
        }
      }
    }
    parentProperty = null;
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

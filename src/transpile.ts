import Handlebars from "handlebars";
import { PropertyDefinition } from "./fields/types";

const iterator: string[] = [];
let properties: { [key: string]: PropertyDefinition } = {};
let chain: PropertyDefinition[] = [];
let currentProperty: PropertyDefinition | null = null;
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
  const variable = node.params[0].original.split(".").pop();
  let returnValue;
  switch (node.path.original) {
    case "if":
      // check to see if the block has an else block
      let target = "module";
      if (iterator.length > 0) {
        target = iterator[iterator.length - 1];
        if (field) {
          target += `.${field}`;
        }
      }
      if (node.inverse) {
        returnValue = `{% if ${target}.${variable} %} ${program(node.program)} {% else %} \`${program(node.inverse)} {% endif %}`;
      } else {
        returnValue = `{% if ${target}.${variable} %} ${program(node.program)} {% endif %}`;
      }
      break;
    case "each":
      // check if the variable is a property
      if (properties[variable]) {
        console.log("Found property in block", variable);
        currentProperty = properties[variable];
        chain.push(currentProperty);
        field = variable;
      }
      const current = variable[0];
      iterator.push(`item_${current}`);
      returnValue = `{% for item_${current} in ${variable} %} ${program(node.program)} {% endfor %}`;
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

const mustache = (node) => {
  // check if the value is a variable or a string
  // @ts-ignore
  let value = node.path.original;
  const valueParts = value.split(".");
  console.log("Value parts", valueParts);
  for (let key in valueParts) {
    let part = valueParts[key];
    if (part === "this") {
      // We're in a loop, so current prop is already set to the thing we're looping over
      value = iterator[iterator.length - 1]; // get the last item in the iterator
    } else if (part === "properties") {
      value = "module";
    } else {
      if (value === "metadata") {
        // This is a special case where we're looking for a property on the metadata object
        value = metadata(part);
      } else {
        if (properties[part]) {
          currentProperty = properties[part];
          chain.push(currentProperty);
          field = part;
        }

        if (!currentProperty) {
          value += `.${part}`;
        } else if (
          currentProperty.type === "link" ||
          currentProperty.type === "button" ||
          currentProperty.type === "breadcrumb"
        ) {
          if (part === "label" || part === "text") {
            value += `.${field}_text`;
          } else if (part === "href" || part === "url") {
            value += `.${field}.href`;
          } else if (part === "rel") {
            value += `.${field}.rel|escape_attr`;
          }
        } else {
          value += `.${part}`;
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

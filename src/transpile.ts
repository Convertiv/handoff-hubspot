import Handlebars from "handlebars";

const iterator: string[] = [];

/**
 * Transpile handlebars code to hubspot code
 * @param code string
 * @returns string
 */
const transpile: (code: string) => string = (code) => {
  const parsed = Handlebars.parse(code);
  return program(parsed);
};

/**
 * Transpile handlebars block to hubspot block
 * @param node
 * @returns
 */
const block = (node) => {
  const variable = node.params[0].original.split(".").pop();
  switch (node.path.original) {
    case "if":
      // check to see if the block has an else block
      if (node.inverse) {
        return `{% if ${variable} %} \n ${program(node.program)} \n {% else %} \`${program(node.inverse)} \n {% endif %}`;
      } else {
        return `{% if ${variable} %} \n ${program(node.program)} \n {% endif %}`;
      }
      break;
    case "each":
      const current = variable[0];
      iterator.push(current);
      return `{% for ${current} in ${variable} %} ${program(node.program)} {% endfor %}`;
      break;
    default:
      throw new Error(`Unknown block type: '${node.path.original}'`);
  }
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
        // check if the value is a variable or a string
        // @ts-ignore
        let value = node.path.original;
        if (value === "this") {
          value = iterator[iterator.length - 1];
        } else if (value.includes("this")) {
          value = value.replace("this.", iterator[iterator.length - 1] + ".");
        } else if (value.includes(".")) {
          value = value.split(".").pop();
        }
        buffer.push(`{{ ${value} }}`);
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

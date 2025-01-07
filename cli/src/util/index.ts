/**
 * Create a camel case string
 * @param str string
 * @returns string
 */
export const camalize: (str: string) => string = (str) => {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
};

/**
 * Camel to dash case
 * @param str string
 * @returns string
 */
export const camelToDashCase: (str: string) => string = (str) =>
  str
    .replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
    .replace(/^-/, "");

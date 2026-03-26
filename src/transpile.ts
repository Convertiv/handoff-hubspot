import Handlebars from "handlebars";
import { PropertyDefinition } from "./fields/types.js";
import { HubdbMapping } from "./config/command.js";
import { v4 as uuidv4 } from "uuid";
import chalk from "chalk";
import { TranspileContext } from "./context.js";

// ─── Search Meta Template ─────────────────────────────────────────────────────

const buildSearchMeta = (_property: PropertyDefinition): string => {
  return `{% set search_page = module.results.use_custom_search_results_template is truthy and module.results.path_id ? content_by_id(module.results.path_id).absolute_url : site_settings.content_search_results_page_path %}

{% unless (search_page is string_containing "//") %}
  {% set search_page = "/" ~ search_page %}
{% endunless %}

{% set search_page = search_page|regex_replace("http:", "") %}

{% set content_types = [
  {
    field_name: "website_pages",
    content_type: "SITE_PAGE"
  },
  {
    field_name: "landing_pages",
    content_type: "LANDING_PAGE"
  },
  {
    field_name: "blog_posts",
    content_type: "BLOG_POST"
  },
  {
    field_name: "listing_pages",
    content_type: "LISTING_PAGE"
  },
  {
    field_name: "knowledge_articles",
    content_type: "KNOWLEDGE_ARTICLE"
  },
  {
    field_name: "case_studies",
    content_type: "HS_CASE_STUDY"
  }
] %}`;
};

// ─── Expression Handling ──────────────────────────────────────────────────────

const translateExpression = (param: any, ctx: TranspileContext): string => {
  if (param.type === "PathExpression") {
    let value = param.original as string;

    if (ctx.hubdbTargetProperty) {
      if (value === `properties.${ctx.hubdbTargetProperty}` || value === `../properties.${ctx.hubdbTargetProperty}`) {
         return "component_data";
      }
    }

    value = value.replace("properties.", "module.");
    const iter = ctx.currentIterator();
    if (iter) {
      value = value.replace("this.", `${iter}.`);
    }
    if (value === "@index") {
      return "loop.index";
    }
    return value;
  } else if (param.type === "StringLiteral") {
    return `'${param.original}'`;
  } else if (param.type === "NumberLiteral") {
    return param.original;
  }
  return "";
};

const handleExpression = (node: any, ctx: TranspileContext): string => {
  const path = node.path.original;
  switch (path) {
    case "eq":
      // Adjust 0-based @index to HubSpot's 1-based loop.index
      if (
        node.params[0].type === "PathExpression" &&
        node.params[0].original === "@index" &&
        node.params[1].type === "NumberLiteral"
      ) {
        node.params[1].original = Number(node.params[1].original) + 1;
      }
      return `${translateExpression(node.params[0], ctx)} == ${translateExpression(node.params[1], ctx)}`;
    default:
      return path;
  }
};

// ─── Mustache Handler ─────────────────────────────────────────────────────────

const handleMustache = (node: any, ctx: TranspileContext): string => {
  if (node.path.original === 'json' && node.params && node.params.length > 0) {
    const fakeNode = {
      type: 'MustacheStatement',
      path: node.params[0]
    };
    const innerValue = handleMustache(fakeNode, ctx);
    const match = innerValue.match(/^\{\{\s*(.*?)\s*\}\}$/);
    if (match) {
      return `{{ ${match[1]}|tojson }}`;
    }
    return `{{ ${innerValue}|tojson }}`;
  }

  let value = node.path.original as string;
  let property: PropertyDefinition | undefined;
  let parentProperty: PropertyDefinition | undefined;
  let searchSpace:
    | { [key: string]: PropertyDefinition }
    | PropertyDefinition = ctx.properties;

  if (value === "this") {
    const iter = ctx.currentIterator();
    value = `${iter}.${ctx.field}`;
  } else if (value === "search_page") {
    value = "search_page";
  } else if (value === "@index") {
    value = "loop.index";
  } else {
    if (value.includes("../properties.")) {
      value = value.replace("../properties.", "properties.");
    }

    if (ctx.hubdbTargetProperty && value === `properties.${ctx.hubdbTargetProperty}`) {
        value = "component_data";
        searchSpace = ctx.properties;
    } else {
      const valueParts = value.split(".");
      for (const part of valueParts) {
      if (part === "this") {
        const iter = ctx.currentIterator();
        value = iter!;
        searchSpace = ctx.currentChain()!;
      } else if (part === "properties") {
        value = "module";
        searchSpace = ctx.properties;
      } else {
        parentProperty = searchSpace as PropertyDefinition;
        if (searchSpace) {
          if (searchSpace[part]) {
            searchSpace = searchSpace[part];
          } else if ((searchSpace as PropertyDefinition).type === "array") {
            searchSpace = (searchSpace as PropertyDefinition).items?.properties?.[part];
          } else if ((searchSpace as PropertyDefinition).type === "object") {
            searchSpace = (searchSpace as PropertyDefinition).properties?.[part];
          }
          // else: keep current searchSpace
        }
        property = searchSpace as PropertyDefinition;

        if (value === "metadata") {
          // metadata() was a no-op in the old code; skip it
          value += `.${part}`;
        } else {
          if (parentProperty) {
            ctx.field = part;
          }

          if (!property) {
            value += `.${part}`;
          } else if (
            parentProperty.type === "link" ||
            parentProperty.type === "button" ||
            parentProperty.type === "breadcrumb"
          ) {
            if (part === "label" || part === "text") {
              value += "_text";
            } else if (part === "href" || part === "url") {
              value += "_url.href|escape_attr";
            } else if (part === "rel") {
              value += ".rel|escape_attr";
            }
          } else if (property.type === "url") {
            value += `.${part}.href|escape_attr`;
          } else if (parentProperty.type === "video_embed") {
            if (part === "poster") {
              value += "_poster";
            } else if (part === "url") {
              // video_embed url is handled by the embed field itself; skip
            } else if (part === "title") {
              value += "_title";
            } else {
              value += `.${part}`;
            }
          } else if (parentProperty.type === "menu") {
            value += `.${part}`;
          } else {
            if (part === "label") {
              value += ".field_label";
            } else {
              value += `.${part}`;
            }
          }
        }
      }
    }
    }
    property = null;
  }

  return `{{ ${value} }}`;
};

// ─── Block Handler ────────────────────────────────────────────────────────────

const handleBlock = (node: any, ctx: TranspileContext): string => {
  if (!node.params || node.params.length === 0) {
    console.log("Warning - there is a parameter with no value");
    return "";
  }

  let param = node.params[0];
  let value = "";
  let expressionValue = "";
  let isExpression = false;

  if (!param.original && param.type === "SubExpression") {
    value = handleExpression(param, ctx);
    expressionValue = value;
    isExpression = true;
  } else {
    value = param.original;
  }

  // Flatten parent scope references
  if (value.includes("../properties.")) {
    value = value.replace("../properties.", "properties.");
  }

  const variableList: string[] = value.split(".");
  let variable = variableList[variableList.length - 1];

  switch (node.path.original) {
    case "field":
      return handleFieldBlock(node, variableList, variable, ctx);

    case "if":
    case "unless":
      return handleIfUnless(
        node, variableList, variable, value, isExpression, ctx
      );

    case "each":
      return handleEach(node, variableList, variable, ctx);

    default:
      throw new Error(`Unknown block type: '${node.path.original}'`);
  }
};

// ─── Field Block ──────────────────────────────────────────────────────────────

const handleFieldBlock = (
  node: any,
  variableList: string[],
  variable: string,
  ctx: TranspileContext
): string => {
  let parentTarget = "module";
  const iter = ctx.currentIterator();
  if (iter) {
    parentTarget = iter;
  }

  let formatValue = `{# field ${node.params[0].original}`;
  const parentProperty = ctx.searchForField(variableList);

  if (parentProperty) {
    formatValue += ` type="${parentProperty.type}"  #}`;
    if (parentProperty.type === "menu") {
      const menuVariable = variableList
        .slice(ctx.iteratorDepth)
        .filter((v) => v !== null)
        .join(".");
      const context = `menu_${uuidv4().substring(1, 6)}`;
      formatValue += `\n{% set ${context} = menu(${parentTarget}.${menuVariable}) %}`;
      ctx.menuContext = context;
    }
    if (parentProperty.type === "search") {
      formatValue += buildSearchMeta(parentProperty);
    }
  } else {
    console.log(chalk.yellow(`Unknown field type: ${variableList[0]}`));
    formatValue += ` type="unknown"  #}`;
  }

  return `${formatValue}\n${handleProgram(node.program, ctx)}{# end field #}`;
};

// ─── If / Unless Block ────────────────────────────────────────────────────────

const handleIfUnless = (
  node: any,
  variableList: string[],
  variable: string,
  value: string,
  isExpression: boolean,
  ctx: TranspileContext
): string => {
  const findProperty = ctx.findParent(variableList);
  let returnValue: string;
  let target = "module";

  // Rewrite paths based on property type
  if (findProperty) {
    if (findProperty.type === "link") {
      variableList[variableList.length - 2] = `${findProperty.id}_url`;
      variableList[variableList.length - 1] = "href";
    } else if (findProperty.type === "video_embed") {
      if (variable === "poster") {
        variableList[variableList.length - 1] = `${findProperty.id}_poster`;
      }
    } else if (
      findProperty.type === "button" ||
      findProperty.type === "breadcrumb"
    ) {
      if (findProperty.id !== variable) {
        variableList[variableList.length - 2] =
          `${findProperty.id}_${variable}`;
        variableList[variableList.length - 1] = "href";
      } else {
        variableList[variableList.length - 1] = `${findProperty.id}_url`;
        variableList.push("href");
      }
    } else if (findProperty.type === "url") {
      variableList[variableList.length - 1] = `${findProperty.id}.href`;
    }
  }

  // Special handling for button/link target attribute
  if (
    (findProperty?.type === "button" || findProperty?.type === "link") &&
    variable === "target"
  ) {
    const propertyKey = Object.keys(ctx.properties).find(
      (key) => ctx.properties[key] === findProperty
    );
    const elementId =
      propertyKey || (findProperty.type === "button" ? "button" : "link");
    const iter = ctx.currentIterator();
    const context = iter || target;
    let statement = `${context}.${elementId}_url.type == 'EXTERNAL'`;
    if (isExpression) {
      statement = value;
    }
    returnValue = `{% if ${statement} %} target="_blank"`;
    if (node.inverse) {
      returnValue += `{% else %} ${handleProgram(node.inverse, ctx)} {% endif %}`;
    } else {
      returnValue += ` {% endif %}`;
    }
    ctx.currentProperty = ctx.lastCurrentProperty;
    return returnValue;
  }

  // Handle loop metadata variables
  if (
    variableList[0] === "@first" ||
    variableList[0] === "@last" ||
    variableList[0] === "@index" ||
    variableList[0] === "@length"
  ) {
    variable = variableList[0];
  } else {
    variable = variableList
      .slice(1)
      .filter((v) => v !== null)
      .join(".");
    const iter = ctx.currentIterator();
    if (iter) {
      if (variableList[0] === "properties") {
        target = "module";
      } else {
        target = iter;
      }
    }
  }

  // Build the statement
  let statement = `${target}.${variable}`;
  if (isExpression) {
    statement = value;
  }

  if (!isExpression && ctx.hubdbTargetProperty && value === `properties.${ctx.hubdbTargetProperty}`) {
    statement = "component_data";
  }

  if (variable === "@first") {
    statement = "loop.first";
  } else if (variable === "@last") {
    statement = "loop.last";
  } else if (variable === "@index") {
    statement = "loop.index";
  } else if (variable === "@length") {
    statement = "loop.length";
  }

  if (node.path.original === "if") {
    returnValue = `{% if ${statement} %} ${handleProgram(node.program, ctx)}`;
    if (node.inverse) {
      returnValue += `{% else %} ${handleProgram(node.inverse, ctx)} {% endif %}`;
    } else {
      returnValue += ` {% endif %}`;
    }
  } else {
    returnValue = `{% unless ${statement} %} ${handleProgram(node.program, ctx)} {% endunless %}`;
  }

  ctx.currentProperty = ctx.lastCurrentProperty;
  return returnValue;
};

// ─── Each Block ───────────────────────────────────────────────────────────────

const handleEach = (
  node: any,
  variableList: string[],
  variable: string,
  ctx: TranspileContext
): string => {
  const searchSpace = ctx.searchForField(variableList);
  if (searchSpace) {
    ctx.currentProperty = searchSpace;
    ctx.pushChain(ctx.currentProperty);
    ctx.field = variable;
  }

  const current = variable[0];
  let loopTarget = "module";
  const iter = ctx.currentIterator();
  if (iter) {
    loopTarget = iter;
  }

  const joinedVariable = variableList
    .slice(1)
    .filter((v) => v !== null)
    .join(".");

  ctx.pushIterator(`item_${current}`);

  let returnValue: string;
  if (ctx.menuContext) {
    returnValue = `{% for item_${current} in ${ctx.menuContext}.children %} `;
    ctx.menuContext = undefined;
    returnValue += `${handleProgram(node.program, ctx)} {% endfor %}`;
  } else {
    returnValue = `{% for item_${current} in ${loopTarget}.${joinedVariable} %} ${handleProgram(node.program, ctx)} {% endfor %}`;
  }

  if (ctx.currentProperty) {
    ctx.currentProperty = ctx.currentChain() || null;
    ctx.field = undefined;
  }

  ctx.popChain();
  ctx.popIterator();

  return returnValue;
};

// ─── Program Handler ──────────────────────────────────────────────────────────

export const handleProgram = (
  program: hbs.AST.Program,
  ctx: TranspileContext
): string => {
  const buffer: string[] = [];
  for (const node of program.body) {
    switch (node.type) {
      case "Program":
        // @ts-ignore — Handlebars AST types are sometimes incorrect
        buffer.push(handleProgram(node, ctx));
        break; // FIX: was missing break, causing fall-through to MustacheStatement
      case "MustacheStatement":
        buffer.push(handleMustache(node, ctx));
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
        buffer.push(handleBlock(node, ctx));
        break;
      default:
        throw new Error(`Unknown node type`);
    }
  }
  return buffer.join("");
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Transpile Handlebars code to HubSpot HubL code.
 * @param code - The Handlebars template string
 * @param props - The component's property definitions
 * @returns The transpiled HubL string
 */
const transpile = (
  code: string,
  props?: { [key: string]: PropertyDefinition },
  hubdbMapping?: HubdbMapping | null,
): string => {
  const ctx = new TranspileContext(props || {}, hubdbMapping);
  const parsed = Handlebars.parse(code);
  let output = handleProgram(parsed, ctx);

  if (ctx.hubdbTargetProperty && ctx.hubdbMappingType) {
      const mapping = { target_property: ctx.hubdbTargetProperty, mapping_type: ctx.hubdbMappingType };
      if (mapping.mapping_type === "xy") {
      let xKey = "x";
      let yKey = "y";
      //@ts-ignore
      const targetProp = ctx.properties[mapping.target_property];
      if (targetProp && targetProp.items && targetProp.items.properties) {
          const keys = Object.keys(targetProp.items.properties);
          if (keys.length >= 2) {
              xKey = keys[0];
              yKey = keys[1];
          }
      }
      output = `{% set component_data = module.${mapping.target_property} %}
{% if module.source == "query" %}
  {% set chart_qs = "limit=" ~ module.query_configs.limit %}
  {% if module.query_configs.sort_column %}
    {% set dir = module.query_configs.sort_direction == "desc" ? "-" : "" %}
    {% set chart_qs = chart_qs ~ "&orderBy=" ~ dir ~ module.query_configs.sort_column %}
  {% endif %}
  {% set db_rows = hubdb_table_rows(module.query_configs.hubdb_table, chart_qs) %}
  {% set table_info = hubdb_table(module.query_configs.hubdb_table) %}
  {% set col_map = {} %}
  {% for col in table_info.columns %}
    {% do col_map.put(col.name, col.id|string) %}
  {% endfor %}
  {% set x_id = col_map[module.query_configs.x_column] || module.query_configs.x_column %}
  {% set y_id = col_map[module.query_configs.y_column] || module.query_configs.y_column %}\n  {% if module.query_configs.show_diagnostics %}
  <div style="background: #f4f6f9; border: 1px solid #cbd6e2; padding: 15px; margin-bottom: 20px; border-radius: 4px; font-family: sans-serif; font-size: 13px; color: #33475b; line-height: 1.5;">
    <strong style="display: block; margin-bottom: 10px; font-size: 15px;">HubDB Query Diagnostics</strong>
    <p style="margin: 0 0 10px;"><strong>Table Selected:</strong> {{ module.query_configs.hubdb_table }}</p>
    <p style="margin: 0 0 5px;"><strong>Available Columns:</strong></p>
    <ul style="margin: 0; padding-left: 20px;">
      {% for col in table_info.columns %}
        <li>{{ col.label }} &mdash; <code>{{ col.name }}</code></li>
      {% endfor %}
    </ul>
    <p style="margin: 10px 0 0; color: #ff7a59;"><em>Note: Turn off "Show Table Diagnostics" in the sidebar before publishing.</em></p>
  </div>
  {% endif %}

  {% set ser_data = [] %}
  {% for row in db_rows %}
    {% do ser_data.append({ "${xKey}": row[x_id], "${yKey}": row[y_id] }) %}
  {% endfor %}
  {% set component_data = ser_data %}
{% endif %}
` + output;
      } else if (mapping.mapping_type === "multi_series") {
          output = `{% set component_data = module.${mapping.target_property} %}
{% if module.source == "query" %}
  {% set chart_qs = "limit=" ~ module.query_configs.limit %}
  {% if module.query_configs.sort_column %}
    {% set dir = module.query_configs.sort_direction == "desc" ? "-" : "" %}
    {% set chart_qs = chart_qs ~ "&orderBy=" ~ dir ~ module.query_configs.sort_column %}
  {% endif %}
  {% set db_rows = hubdb_table_rows(module.query_configs.hubdb_table, chart_qs) %}
  {% set table_info = hubdb_table(module.query_configs.hubdb_table) %}
  {% set col_map = {} %}
  {% for col in table_info.columns %}
    {% do col_map.put(col.name, col.id|string) %}
  {% endfor %}
  {% set x_id = col_map[module.query_configs.x_column] || module.query_configs.x_column %}
  {% if module.query_configs.show_diagnostics %}
  <div style="background: #f4f6f9; border: 1px solid #cbd6e2; padding: 15px; margin-bottom: 20px; border-radius: 4px; font-family: sans-serif; font-size: 13px; color: #33475b; line-height: 1.5;">
    <strong style="display: block; margin-bottom: 10px; font-size: 15px;">HubDB Query Diagnostics</strong>
    <p style="margin: 0 0 10px;"><strong>Table Selected:</strong> {{ module.query_configs.hubdb_table }}</p>
    <p style="margin: 0 0 5px;"><strong>Available Columns:</strong></p>
    <ul style="margin: 0; padding-left: 20px;">
      {% for col in table_info.columns %}
        <li>{{ col.label }} &mdash; <code>{{ col.name }}</code></li>
      {% endfor %}
    </ul>
    <p style="margin: 10px 0 0; color: #ff7a59;"><em>Note: Turn off "Show Table Diagnostics" in the sidebar before publishing.</em></p>
  </div>
  {% endif %}
  {% set cats = [] %}
  {% for row in db_rows %}
    {% do cats.append(row[x_id]) %}
  {% endfor %}

  {% set series_list = [] %}
  {% for series_cfg in module.query_configs.y_series %}
    {% set ser_data = [] %}
    {% set y_id = col_map[series_cfg.y_column] || series_cfg.y_column %}
    {% for row in db_rows %}
      {% do ser_data.append(row[y_id]) %}
    {% endfor %}
    {% do series_list.append({ "name": series_cfg.series_name, "data": ser_data, "colorKey": series_cfg.color }) %}
  {% endfor %}
  {% set component_data = { "categories": cats, "series": series_list } %}
{% endif %}
` + output;
      }
  }

  return output;
};

// Re-export for backward compatibility
export const program = (prog: hbs.AST.Program): string => {
  // This is kept for backward compatibility but should not be used directly.
  // It creates a fresh context with no properties — only useful for tests
  // that call program() directly.
  const ctx = new TranspileContext({});
  return handleProgram(prog, ctx);
};

export default transpile;

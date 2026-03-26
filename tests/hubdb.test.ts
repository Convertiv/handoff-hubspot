import { describe, expect, it } from "vitest";
import transpile from "../src/transpile.js";
import { buildFields } from "../src/fields/fields.js";
import { processHubdbMappings } from "../src/fields/hubdb.js";
import { HubdbMapping } from "../src/config/command.js";

describe("HubDB Integration Mappings", () => {
  it("Should correctly append generic hubdb fields to component JSON when target match occurs", () => {
    const mapping: HubdbMapping = {
      target_property: "chart_data",
      mapping_type: "multi_series",
    };

    const componentProperties: any = {
      chart_data: {
        id: "chart_data",
        name: "chart_data",
        type: "object",
        properties: {},
      },
    };

    const baseFields = buildFields(componentProperties);
    const results = processHubdbMappings(baseFields, mapping);

    expect(results.length).toBe(3);
    expect(results[0].name).toBe("source");
    expect(results[0].type).toBe("choice");
    expect(results[1].name).toBe("query_configs");
    expect(results[1].children.find((f: any) => f.name === "hubdb_table")?.type).toBe("hubdbtable");
    expect(results[1].children.find((f: any) => f.name === "y_series")?.type).toBe("group");
    expect(results[2].visibility?.controlling_field_path).toBe("source");
    expect(results[2].visibility?.controlling_value_regex).toBe("manual");
  });

  it("Should transpile AST dynamic targeting property and append HubL macro for XY sources", () => {
    const handlebars = `
    <div id="chart" data-opts='{{#if properties.chart_data}}{{properties.chart_data}}{{else}}{}{{/if}}'></div>
    `;

    const mapping: HubdbMapping = {
      target_property: "chart_data",
      mapping_type: "xy",
    };

    const transpiled = transpile(handlebars, {}, mapping);

    expect(transpiled).toContain("{% if component_data %}");
    expect(transpiled).toContain("{{ component_data }}");

    expect(transpiled).toContain("{% set component_data = module.chart_data %}");
    expect(transpiled).toContain("hubdb_table_rows(module.query_configs.hubdb_table");
    expect(transpiled).toContain(`"y": row[y_id]`);
  });

  it("Should transpile AST dynamic targeting property and append HubL macro for Multi-Series limit/sort maps", () => {
    const handlebars = `
    <script>const data = {{#if properties.chart_data}}{{properties.chart_data}}{{else}}{}{{/if}};</script>
    `;

    const mapping: HubdbMapping = {
      target_property: "chart_data",
      mapping_type: "multi_series",
    };

    const transpiled = transpile(handlebars, {}, mapping);

    expect(transpiled).toContain("const data = {% if component_data %}");    expect(transpiled).toContain("{{ component_data }}");
    
    expect(transpiled).toContain("{% for series_cfg in module.query_configs.y_series %}");
    expect(transpiled).toContain(`series_list.append({ "name": series_cfg.series_name, "data": ser_data, "colorKey": series_cfg.color })`);
  });
});

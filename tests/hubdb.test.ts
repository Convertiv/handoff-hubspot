import { describe, expect, it } from "vitest";
import transpile from "../src/transpile.js";
import { buildFields } from "../src/fields/fields.js";
import { processHubdbMappings } from "../src/fields/hubdb.js";

describe("HubDB Integration Mappings", () => {
  it("Should correctly append generic hubdb fields to component JSON when target match occurs", () => {
    const mockConfig: any = {
      hubdb_mappings: {
        "test_component": {
          target_property: "chart_data",
          mapping_type: "multi_series",
        },
      },
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
    const results = processHubdbMappings(baseFields, mockConfig, "test_component");

    expect(results.length).toBe(2);
    expect(results[0].name).toBe("query_configs");
    expect(results[0].children.find((f: any) => f.name === "hubdb_table")?.type).toBe("hubdbtable");
    expect(results[0].children.find((f: any) => f.name === "y_series")?.type).toBe("group");
  });

  it("Should transpile AST dynamic targeting property and append HubL macro for XY sources", () => {
    const handlebars = `
    <div id="chart" data-opts='{{#if properties.chart_data}}{{properties.chart_data}}{{else}}{}{{/if}}'></div>
    `;

    const mockConfig: any = {
      hubdb_mappings: {
        "test_xy": {
          target_property: "chart_data",
          mapping_type: "xy",
        },
      },
    };

    const transpiled = transpile(handlebars, {}, mockConfig, "test_xy");

    expect(transpiled).toContain("{% if component_data %}");
    expect(transpiled).toContain("{{ component_data }}");

    // Expect the appended setup block
    expect(transpiled).toContain("{% set component_data = module.chart_data %}");
    expect(transpiled).toContain("hubdb_table_rows(module.query_configs.hubdb_table");
    expect(transpiled).toContain(`"y": row[y_id]`);
  });

  it("Should transpile AST dynamic targeting property and append HubL macro for Multi-Series limit/sort maps", () => {
    const handlebars = `
    <script>const data = {{#if properties.chart_data}}{{properties.chart_data}}{{else}}{}{{/if}};</script>
    `;

    const mockConfig: any = {
      hubdb_mappings: {
        "test_multi": {
          target_property: "chart_data",
          mapping_type: "multi_series",
        },
      },
    };

    const transpiled = transpile(handlebars, {}, mockConfig, "test_multi");

    expect(transpiled).toContain("const data = {% if component_data %}");    expect(transpiled).toContain("{{ component_data }}");
    
    // Check for Multi-series generation logic mapped over y_series iterators
    expect(transpiled).toContain("{% for series_cfg in module.query_configs.y_series %}");
    expect(transpiled).toContain(`series_list.append({ "name": series_cfg.series_name, "data": ser_data, "colorKey": series_cfg.color })`);
  });
});

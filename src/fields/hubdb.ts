import { AppConfig } from "../config/command.js";

/**
 * Mutates the base fields array to inject HubDB mapping specific fields
 * if the component is defined in handoff.config.json
 */
export const processHubdbMappings = (
  fields: any[],
  config: AppConfig,
  componentId: string
) => {
  if (!config.hubdb_mappings || !config.hubdb_mappings[componentId]) {
    return fields;
  }

  const mapping = config.hubdb_mappings[componentId];
  if (!mapping.target_property || !mapping.mapping_type) {
    return fields;
  }

  const targetName = mapping.target_property;
  // Make sure the target property exists in the fields
  const targetFieldIndex = fields.findIndex((f) => f.name === targetName);

  if (targetFieldIndex === -1) {
    return fields;
  }

  // Define HubDB universal fields
  const hubdbFields: any[] = [
    {
      id: "hubdb_table",
      name: "hubdb_table",
      label: "HubDB Table",
      type: "hubdbtable",
      help_text: "Select the HubDB table to query data from.",
      locked: false,
      required: false,
    },
    {
      id: "x_column",
      name: "x_column",
      label: "X-Axis Column Name",
      type: "text",
      help_text: "Enter the internal name of the column. Turn on 'Show Table Diagnostics' below to view valid column names.",
      locked: false,
      required: false,
    },
    {
      id: "limit",
      name: "limit",
      label: "Limit",
      type: "number",
      default: 100,
      locked: false,
      required: false,
    },
    {
      id: "sort_column",
      name: "sort_column",
      label: "Sort Column Name",
      type: "text",
      locked: false,
      required: false,
    },
    {
      id: "sort_direction",
      name: "sort_direction",
      label: "Sort Direction",
      type: "choice",
      display: "select",
      choices: [
        ["asc", "Ascending"],
        ["desc", "Descending"],
      ],
      default: "asc",
      locked: false,
      required: false,
    },
  ];

  if (mapping.mapping_type === "xy") {
    hubdbFields.push({
      id: "y_column",
      name: "y_column",
      label: "Y-Axis Column Name",
      type: "text",
      help_text: "Enter the internal name of the column.",
      locked: false,
      required: false,
      default: "",
    });
  } else if (mapping.mapping_type === "multi_series") {
    hubdbFields.push({
      id: "y_series",
      name: "y_series",
      label: "Y-Axis Series",
      type: "group",
      locked: false,
      required: false,
      occurrence: { min: 0, max: 100 },
      children: [
        {
          id: "series_name",
          name: "series_name",
          label: "Series Name",
          type: "text",
          locked: false,
          required: false,
        },
        {
          id: "y_column",
          name: "y_column",
          label: "HubDB Column Name",
          type: "text",
          locked: false,
          required: false,
        },
        {
          id: "color",
          name: "color",
          label: "Series Color",
          type: "color",
          locked: false,
          required: false,
        },
      ],
    } as any);
  }

  hubdbFields.push({
    id: "show_diagnostics",
    name: "show_diagnostics",
    label: "Show Table Diagnostics",
    type: "boolean",
    display: "toggle",
    help_text: "Turn this on while editing to render a diagnostic panel on the page showing all valid internal column names.",
    default: false,
    locked: false,
    required: false,
  });

  // Create a Query Config group to hold all these cleanly
  const queryConfigGroup = {
    id: "query_configs",
    name: "query_configs",
    label: "HubDB Query Config",
    type: "group",
    locked: false,
    required: false,
    children: hubdbFields,
    visibility: {
      controlling_field_path: "source",
      controlling_value_regex: "query",
      operator: "EQUAL"
    }
  };

  const sourceField = {
    id: "source",
    name: "source",
    label: "Data Source",
    type: "choice",
    display: "select",
    choices: [
      ["query", "Query Builder"],
      ["manual", "Manual Data"],
    ],
    default: "manual",
    locked: false,
    required: false,
    help_text: "Choose how data is provided to this module.",
  };

  // Gate the target array/object field so it only shows in Manual Data mode
  fields[targetFieldIndex].visibility = {
    controlling_field_path: "source",
    controlling_value_regex: "manual",
    operator: "EQUAL",
  };

  // Insert: source field → query_configs group → target field (with visibility)
  fields.splice(targetFieldIndex, 0, queryConfigGroup);
  fields.splice(targetFieldIndex, 0, sourceField);

  return fields;
};

# Handoff Hubspot Client

This is a transformer client for the Handoff frontend API. It reads from a
component set of hosted handoff components, and validates them against the
Hubspot module specification. It then transpiles the handlebars code into
hubspot module code with attached css/js and fields.

## Quick Start

### Requirements

- Node 20, NPM

1. Run `npm install -g handoff-hubspot`
2. Run `handoff-hubspot config`. This will ask you for the url to your hubspot
   instance, the paths to your shared css and your modules folder.
3. Run `handoff-hubspot list` to get a list of components available to you.
4. Run `handoff-hubspot fetch [component]` to pull down a component and transpile
   it to hubspot module.

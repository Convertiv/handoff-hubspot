# Handoff Hubspot Client

This is a transformer client for the Handoff frontend API. It reads from a
component set of hosted handoff components, and validates them against the
Hubspot module specification. It then transpiles the handlebars code into
hubspot module code with attached css/js and fields.


## Installation

```bash
npm install -g handoff-hubspot
```

## Usage

```bash
handoff-hubspot 

Commands:
  index.js config                Build the handoff config
  index.js styles                Fetch shared styles from handoff
  index.js list                  List the components available in handoff
  index.js docs [component]      Open the documentation page for a component
  index.js fetch [component]     Fetch a component and transform it to a hubspot
                                 component
  index.js validate [component]  Read the component and validate it
  index.js validate:all          Pull a list of all components and validate them
  index.js fetch:all             Fetch and build all components

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
  
```



### Requirements

- Node 20, NPM
- A handoff site url
- A hubspot instance if you want to push the components to hubspot

## Quick Start


1. Run `npm install -g handoff-hubspot`
2. Run `handoff-hubspot config`. This will ask you for the url to your hubspot
   instance, the paths to your shared css and your modules folder.
3. Run `handoff-hubspot list` to get a list of components available to you.
4. Run `handoff-hubspot fetch [component]` to pull down a component and transpile
   it to hubspot module.

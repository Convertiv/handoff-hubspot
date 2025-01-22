import transpile from "./transpile"

const test = `
<div>
    <h1>{{title}}</h1>
    {{#if show}}
        <p>Nothing to show</p>
    {{/if}}

    {{#if show}}
        <p>{{description}}</p>
    {{else}}
        <p>Nothing to show</p>
    {{/if}}

    {{#each items}}
        <p>{{this}}</p>
    {{/each}}
</div>`

const testJS = `
<div>
    <h1>{{title}}</h1>
    $
        <p>{{description}}</p>
    {{#else}}
        <p>Nothing to show</p>
    {{/if}}

    {{#each items}}
        <p>{{this}}</p>
    {{/each}}
</div>`

const ifTest = `
{{#if show}}
    <p>Nothing to show</p>
{{/if}}`

console.log(transpile(test));
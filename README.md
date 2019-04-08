# javascript2typescript

The library is a helper to convert JavaScript to TypeScript. 

## Features
- define class/instance properties
- convert require/exports to import/export
- migrate jsdoc into type definition

## How to run

```js
$ npx javascript2typescript <dirname or filename>

// or

$ npm install -D javascript2typescript
$ npx j2t <dirname or filename>

//or 

$ yarn add -D javascript2typescript
$ yarn j2t <dirname or filename>
```


## Options

|command|description|
|---|---|
|--write|create TypeScript files|
|--rm|remove JavaScript files|
|-d|convert `export = xxx` to `export default xxx`|

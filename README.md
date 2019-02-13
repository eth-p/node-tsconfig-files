# tsconfig-files
[![npm version](https://badge.fury.io/js/tsconfig-files.svg)](https://badge.fury.io/js/tsconfig-files)

A small library to find source files from a tsconfig.json file.

## Install

```bash
$ npm install tsconfig-files
```

## Usage

example.js:

```javascript
// import {getFilesFromTsconfig} from "tsconfig-files";
const getFilesFromTsconfig = require("tsconfig-files").getFilesFromTsconfig;

getFilesFromTsconfig('.').then((files) => {
	console.log(files);
}, (error) => {
	console.error(error);
});
```

## API

**getFilesFromTsconfig(cwd): Promise<string[]>**

Returns a `Promise` containing the files matched by `tsconfig.json` in `cwd`.
 

**getFilesFromTsconfigSync(cwd): string[]>**

Returns the files matched by `tsconfig.json` in `cwd`.
The async form is preferred over this function.
 
**getFilesFromTsconfigJson(json, root): Promise<string[]>**

Returns a `Promise` containing the files matched by the provided tsconfig json.

**getFilesFromTsconfigSync(json, root): string[]>**

Returns the files matched by the provided tsconfig json.
The async form is preferred over this function.
 
## License
MIT &copy; [eth-p](https://github.com/eth-p)

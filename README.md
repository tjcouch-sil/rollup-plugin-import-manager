# rollup-plugin-import-manager

A Rollup plugin which makes it possible to manipulate import statement. Deleting, adding, manipulating the members. It is made for ES6 Import Statements. But for commonjs and dynamic imports at least it is possible to change the imported module.

## Install
Using npm:
```console
npm install rollup-plugin-import-manager --save-dev
```

## How it works
**rollup-plugin-import-manager** analyzes each file (which is uses for the rollup building process) for import statements. Those are converted into unit objects, which the user can interact with. Also the creation of new units &rarr; import statements is possible. 



## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin, eg:

```js
import { importManager } from "rollup-plugin-import-manager";

export default {
    input: 'src/index.js',
    output: {   
        format: "es",
        name: "myBuild",
        file: "./dist/build.js",
    },
    plugins: [
        importManager({
            units: [
                "file": "index.js",
                "module": "my-module.js",
                "actions": [
                    // ...
                ]
            ]
        })
    ]
}
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).


## Options

### `include`  
Type: `String` | `Array[...String]`  
Default: `null`  

A [minimatch pattern](https://github.com/isaacs/minimatch), or array of patterns, which specifies the files in the build the plugin should operate on. By default all files are targeted. Each unit has the possibility to target a specific file. See LINK


### `exclude`  
Type: `String` | `Array[...String]`  
Default: `null`  

A [minimatch pattern](https://github.com/isaacs/minimatch), or array of patterns, which specifies the files in the build the plugin should _ignore_. By default no files are ignored.


### `showDiff`  
Type: `String`  
Default: `null`  

A [debugging](#debugging) method. If set to anything other than the string `"file"` a console output of [diff](https://github.com/kpdecker/jsdiff) is shown. It is modified a little and looks much like the default output of diff from the [GNU diffutils](https://www.gnu.org/software/diffutils/), with colors on top. If set to `"file"` the whole file with insertions and deletions is shown. Either way it only gets logged if there are any changes at all. If this is not the case, there is another global debugging method available:


### `debug`  
Type: `String`  
Default: `null`  

A [debugging](#debugging) method. If more than one source file is involved, this really only is useful in combination with [include](#include). It stops the building process by throwing an intentional error and lists all units of the first file, that is processed. Even more verbose information about all unit objects can be made accessible by passing the strings `verbose`, `object(s)` or `import(s)` (which one to use doesn't matter). 

### `units`
Type: `Array[...Object]`  
Default: `null`  

This is where the plugin comes to life. Here is the place where units are getting selected, created or removed. It has several **options** by itself:

---

#### `module`  (option for units)
Type: `String`  
Default: `null`  

Select a unit by its module name. Each import has a name object. This is constructed from the module (path).
For relative imports the path information are getting removed. This may look like this:
```js
import ClassName from "./path/my-module.js";
```
The internal name will be `my-module.js`. And can be matched with: `module: "my-module.js"`  
(The matching method is a little more generous, so you can skip the extension if you like and if this doesn't lead to multiple matches).  

Absolute imports are directly taken as the name attribute. Eg:
```js
import ClassName from "module";
```
The internal name will be `module` and can be matched by that name: `module: "module"`


#### `hash` (option for units)
Type: `String`  
Default: `null`  

Selects a unit by its hash. This is more like an emergency solution. If for any reason it is not possible to match via the module name, this is an alternative. If you ask yourself, where on earth you can figure out the hash, you can rest assured. If multiple matches are found the hashes are logged to the console. Also by running a global [debugging](#debug), the hash can be found.  

The hash is generated by the module name and its members and also the filename and path. If the filename (or path) or any of the other properties are changing so is the hash. The build will fail in this case, so no need to worry to overlook it. The matching via module name should nevertheless be preferred.

If the hash option is set, the [module](#module) option will get ignored.


#### `id` (option for units)
Type: `Number`  
Default: `null`  

Internally every unit gets an Id. There are different scopes for the generation:
 * es6: `1000`
 * dynamic: `2000`
 * cjs: `3000`

The first ES6 Import statement of a file will have the Id `1000`, the second `1001` and so forth. For a quick test you can select via Id (if the [filename](#file) is specified). But actually this is only an internal method to locate the statements. Testing is the only other reason to use it. If one statement is added before the one to match, the Id will change, and there is a good change to not even realize that. You have been warned (and you will get warned again by the plugin if you decide to use it). 

If the id option is set, [hash](#hash) and [module](#module) will get ignored.


#### `file` (option for units)
Type: `String`  
Default: `null`  

A [minimatch pattern](https://github.com/isaacs/minimatch), which specifies the file where the unit is located.  

It is always a good idea to set it, even if the files are already limited by include or exclude. The reason for this is, that a the unit is expected to be in the specified file and and error is thrown if it doesn't match. Otherwise it will simply be ignored, if a match is not there.  

Also for unit creation this is almost always critical. If there are multiple source files, the fresh import statement will get created in any file, that is processed (and this maybe not what you want and also will most likely lead to errors).  

However, it is not mandatory.

#### `debug` <sub><sup>(option for units)</sup></sub>
Type: `Any`  
Default: `null`  

A [debugging](#debugging) method for a specific unit. This also throws an intentional debugging error, which stops the building process. Verbose information about the specific unit are logged to the console.




## Examples
TODO

## Debugging
TODO
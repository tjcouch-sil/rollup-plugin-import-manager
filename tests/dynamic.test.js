import test from "ava";
import { rollup } from "rollup";
import { importManager } from "../src/index.js";
import { DebuggingError } from "../src/errors.js";


test("selecting unit by module name", async (t) => {
    
    const debug = await t.throwsAsync(() => {
        return rollup({
            input: "./tests/fixtures/hi.dynamic.js",
            plugins: [
                importManager({
                    units: {
                        file: "**/hi.dynamic.js",
                        module: "hello",
                        actions: "debug"
                    }
                })
            ]
        }); 
    }, { instanceOf: DebuggingError });

    const unit = JSON.parse(debug.message);
    t.is(unit.module.name, "hello.js");
});


test("selecting unit by hash", async (t) => {
    
    const debug = await t.throwsAsync(() => {
        return rollup({
            input: "./tests/fixtures/hi.dynamic.js",
            plugins: [
                importManager({
                    units: {
                        file: "**/hi.dynamic.js",
                        hash: 119470642,
                        actions: "debug"
                    }
                })
            ]
        }); 
    }, { instanceOf: DebuggingError });

    const unit = JSON.parse(debug.message);
    t.is(unit.module.name, "hello.js");
});


test("selecting unit by id", async (t) => {
    
    const debug = await t.throwsAsync(() => {
        return rollup({
            input: "./tests/fixtures/hi.dynamic.js",
            plugins: [
                importManager({
                    warnings: false,
                    units: {
                        file: "**/hi.dynamic.js",
                        id: 2000,
                        actions: "debug"
                    }
                })
            ]
        }); 

    }, { instanceOf: DebuggingError });

    const unit = JSON.parse(debug.message);
    t.is(unit.module.name, "hello.js");
});


test("removing import statement", async (t) => {
    
    const bundle = await rollup({
        input: "./tests/fixtures/hi.dynamic.js",
        plugins: [
            importManager({
                units: {
                    file: "**/hi.dynamic.js",
                    module: "hello",
                    actions: "remove"
                }
            })
        ]
    });

    t.truthy(bundle.watchFiles.length === 1);
});


test("changing a module (renaming)", async (t) => {
    
    const bundle = await rollup({
        input: "./tests/fixtures/hi.dynamic.js",
        plugins: [
            importManager({
                units: {
                    file: "**/hi.dynamic.js",
                    module: "hello",
                    actions: {
                        select: "module",
                        rename: "./lib/hello-clone.js"
                    }
                }
            })
        ]
    });
     
    const modPath = Boolean(
        bundle.watchFiles.filter(f => f.indexOf("hello-clone.js") > -1).at(0)
    );

    t.truthy(modPath);
});


test("creating an import statement", async (t) => {
    
    const bundle = await rollup({
        input: "./tests/fixtures/hi.dynamic.js",
        plugins: [
            importManager({
                units: {
                    file: "**/hi.dynamic.js",
                    createModule: "./lib/create.js",
                    type: "dynamic",
                    const: "create"
                }
            })
        ]
    });

    const code = bundle.cache.modules.at(0).code;
    const node = bundle
        .cache.modules.at(0).ast    // parse tree
        .body.at(0);                // first import statement
    

    const importStatement = code.slice(node.start, node.end);
    t.is(
        importStatement,
        "const create = await import(\"./lib/create.js\");"
    );
});


test("appending an import statement after a specific module", async (t) => {
    
    const bundle = await rollup({
        input: "./tests/fixtures/hi.dynamic.js",
        plugins: [
            importManager({
                units: {
                    file: "**/hi.dynamic.js",
                    createModule: "./lib/create.js",
                    type: "dynamic",
                    let: "create",
                    append: {
                        module: "hello"
                    }
                }
            })
        ]
    });

    const code = bundle.cache.modules.at(0).code;
    const node = bundle
        .cache.modules.at(0).ast    // parse tree
        .body.at(1);                // second import statement
    

    const importStatement = code.slice(node.start, node.end);
    t.is(
        importStatement,
        "let create = await import(\"./lib/create.js\");"
    );
});


test("prepending a manual created statement before a specific module, selected via hash", async (t) => {
    
    const bundle = await rollup({
        input: "./tests/fixtures/hi.dynamic.js",
        plugins: [
            importManager({
                units: {
                    file: "**/hi.dynamic.js",
                    addCode: "let create;\nimport(\"./lib/create.js\").then(i => create = i);\n",
                    prepend: {
                        hash: 119470642
                    }
                }
            })
        ]
    });

    const code = bundle.cache.modules.at(0).code;
    const node = bundle
        .cache.modules.at(0).ast    // parse tree
        .body.at(0);                // first import statement
    

    const varDeclaration = code.slice(node.start, node.end);
    t.is(
        varDeclaration,
        "let create;"
    );

    // TODO: test the import statement
});
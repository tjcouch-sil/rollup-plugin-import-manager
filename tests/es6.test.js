import test from "ava";
import { parse } from "acorn";
import { rollup } from "rollup";
import { importManager } from "../src/index.js";
import { DebuggingError, MatchError } from "../src/errors.js";


const PARSER_OPTIONS = {
    ecmaVersion: "latest",
    sourceType: "module"
};

console.log("Testing ES6 features:");

test("select unit by module name", async (t) => {
    
    const debug = await t.throwsAsync(() => {
        return rollup({
            input: "./tests/fixtures/hi.js",
            plugins: [
                importManager({
                    units: {
                        file: "**/hi.js",
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


test("select unit by hash", async (t) => {
    
    const debug = await t.throwsAsync(() => {
        return rollup({
            input: "./tests/fixtures/hi.js",
            plugins: [
                importManager({
                    units: {
                        file: "**/hi.js",
                        hash: 3790884003,
                        actions: "debug"
                    }
                })
            ]
        }); 
    }, { instanceOf: DebuggingError });

    const unit = JSON.parse(debug.message);
    t.is(unit.module.name, "hello.js");
});


test("select unit by id", async (t) => {
    
    const debug = await t.throwsAsync(() => {
        return rollup({
            input: "./tests/fixtures/hi.js",
            plugins: [
                importManager({
                    warnings: false,
                    units: {
                        file: "**/hi.js",
                        id: 1000,
                        actions: "debug"
                    }
                })
            ]
        }); 

    }, { instanceOf: DebuggingError });

    const unit = JSON.parse(debug.message);
    t.is(unit.module.name, "hello.js");
});


test("remove import statement", async (t) => {
    
    const bundle = await rollup({
        input: "./tests/fixtures/hi.js",
        plugins: [
            importManager({
                units: {
                    file: "**/hi.js",
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
        input: "./tests/fixtures/hi.js",
        plugins: [
            importManager({
                units: {
                    file: "**/hi.js",
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


test("adding a member", async (t) => {
    
    const bundle = await rollup({
        input: "./tests/fixtures/hi.js",
        plugins: [
            importManager({
                units: {
                    file: "**/hi.js",
                    module: "hello",
                    actions: {
                        select: "members",
                        add: "bonJour"
                    }
                }
            })
        ]
    });

    const mod = bundle
        .cache.modules.at(1).ast    // parse tree
        .body.at(0)                 // first import statement
        .specifiers.at(3)           // the member at index 3
        .imported.name;             // name
    
    t.is(mod, "bonJour");
});


test("renaming a member", async (t) => {
    
    const bundle = await rollup({
        input: "./tests/fixtures/hi.js",
        plugins: [
            importManager({
                units: {
                    file: "**/hi.js",
                    module: "hello",
                    actions: {
                        select: "member",
                        name: "hallo",
                        rename: "bonJour"
                    }
                }
            })
        ]
    });

    const mod = bundle
        .cache.modules.at(1).ast    // parse tree
        .body.at(0)                 // first import statement
        .specifiers.at(2)           // the member at index 2
        .imported.name;             // name
    
    t.is(mod, "bonJour");
});


test("renaming a member (keeping the alias)", async (t) => {
    
    const bundle = await rollup({
        input: "./tests/fixtures/hi.js",
        plugins: [
            importManager({
                units: {
                    file: "**/hi.js",
                    module: "hello",
                    actions: {
                        select: "member",
                        name: "hello",
                        rename: "bonJour"
                        
                    }
                }
            })
        ]
    });

    const mod = bundle
        .cache.modules.at(1).ast    // parse tree
        .body.at(0)                 // first import statement
        .specifiers.at(2)           // the member at index 2
        .imported.name;             // name
    
    t.is(mod, "bonJour");
});



test("removing a member", async (t) => {
    
    const bundle = await rollup({
        input: "./tests/fixtures/hi.js",
        plugins: [
            importManager({
                units: {
                    file: "**/hi.js",
                    module: "hello",
                    actions: {
                        select: "member",
                        name: "hallo",
                        remove: null
                    }
                }
            })
        ]
    });
    
    const { output } = await bundle.generate({ format: "es" });
    const code = output.at(0).code;

    t.notRegex(code, /hallo!/);
});


test("removing all members", async (t) => {
    
    const bundle = await rollup({
        input: "./tests/fixtures/hi.js",
        plugins: [
            importManager({
                units: {
                    file: "**/hi.js",
                    module: "hello",
                    actions: {
                        select: "members",
                        remove: null
                    }
                }
            })
        ]
    });
    
    const { output } = await bundle.generate({ format: "es" });
    const code = output.at(0).code;

    t.notRegex(code, /hello!/);
    t.notRegex(code, /hallo!/);
});






test("dummy - TODO: remove me", async (t) => {
    const bundle = await rollup({
        input: "./tests/fixtures/hi.js",
        plugins: [
            importManager({
                units: {
                    file: "**/hi.js",
                    module: "hello",
                    actions: {
                        select: "member",
                        name: "hello",
                        rename: "hallo",
                        keepAlias: true
                    }
                }
            })
        ]
    });
    
    const { output } = await bundle.generate({ format: "es" });
    const parsedCode = parse(output.at(0).code, PARSER_OPTIONS);
    
    const replaced = parsedCode.body.at(0).declarations.at(0).init.body.value;

    t.is(replaced, "hallo!");
});





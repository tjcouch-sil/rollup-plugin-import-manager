import { createFilter } from "@rollup/pluginutils";
import ImportManager from "./core.js";
import picomatch from "picomatch"; 

const isObject = input => typeof input === "object" && !Array.isArray(input) && input !== null;

// helper to allow string and array
const ensureArray = (input) => Array.isArray(input) ? input : [ String(input) ];

// helper to allow string and object
const ensureObj = (input) => {
    let output;

    if (typeof input === "string") {
        output = {};
        output[input] = null;
    }
    
    else if (isObject(input)) {
        output = input;
    }
    else {
        throw new TypeError("Only strings and objects are allowed for actions.");
    }
    
    return output;
}

// makes the life of the user a little bit easier
// by accepting multiple versions of boolean vars 
const bool = (b) => !(Boolean(b) === false || String(b).match(/^(?:false|no?|0)$/, "i"));

// allow some variations to enable object mode 
// for debugging
const showObjects = (v) => Boolean(String(v).match(/^(?:objects?|imports?)$/));


const selectModule = (section, manager, useId, allowNull) => {
    if (!isObject(section)) {
        throw new TypeError("Input must be an object.");
    }

    let unit;

    if (useId) {
        unit = manager.selectModById(section.id, allowNull);
    } else if ("hash" in section) {
        unit = manager.selectModByHash(section.hash, allowNull);
    } else if ("module" in section) {
        unit = manager.selectModByName(section.module, section.type, allowNull);
    }
    
    return unit;
}


// main
const manager = (options={}) => {
    console.log("options", options);

    const filter = createFilter(options.include, options.exclude);
  
    return {
        name: 'ImportManager',
    
        transform (source, id) {
            console.log("id", id);
            if (!filter(id)) return;

            const importManager = new ImportManager(source, id);       

            if (!("units" in options) || "debug" in options) {
                if (showObjects(options.debug)) {
                    importManager.logUnitObjects();
                } else {
                    importManager.logUnits();
                };
            }
            
            else {
                
                let allowCreation = false;
                let allowNull = true;
                let useId = false;

                for (const unitSection of ensureArray(options.units)) { 

                    if ("file" in unitSection) {
                        console.log(unitSection.file, "obj.file");

                        //const isMatch = picomatch(obj.file);
                        const isMatch = (id) => (id.indexOf(unitSection.file) > -1);
                        // FIXME: proper implementation
                        
                        if (!isMatch(id)) {
                            console.log(id, "NO!");
                            return;
                        }

                        allowCreation = true;
                        allowNull = false;
                        useId = "id" in unitSection;
                    }

                    let unit;
                    
                    if ("createModule" in unitSection) {
                        // new unit

                        const module = unitSection.createModule;
                        let defaultMembers = [];
                        let members = [];
                        
                        if ("defaultMembers" in unitSection) {
                            defaultMembers = ensureArray(unitSection.defaultMembers);
                        }

                        if ("members" in unitSection) {
                            members = ensureArray(unitSection.members);
                        }

                        const statement = importManager.makeES6Statement(module, defaultMembers, members);
                        
                        if ("insert" in unitSection) {
                            importManager.insertStatement(statement, unitSection.insert);
                        } else if ("append" in unitSection || "prepend" in unitSection) {
                            const mode = "append" in unitSection ? "append" : "prepend";
                            const section = unitSection[mode]; 
                            const target = selectModule(
                                section,
                                importManager,
                                "id" in section,
                                false
                            );
                            importManager.insertAtUnit(target, mode, statement);
                        }

                        continue;
                    }
                    
                    unit = selectModule(
                        unitSection,
                        importManager,
                        useId,
                        allowNull
                    );
                    
                    
                    if ("actions" in unitSection) {

                        for (let action of ensureArray(unitSection.actions)) {
                            
                            action = ensureObj(action);
                            
                            if ("debug" in action) {
                                unit.methods.log();       
                            }
                            
                            else if ("select" in action) {
                                if (action.select === "module" && "rename" in action) {
                                    const modType = ("modType" in action) ? action.modType : unit.module.type;
                                    unit.methods.renameModule(action.rename, modType);
                                }

                                else if (action.select === "member" || action.select === "defaultMember" ) {
                                    const memberType = action.select;
                                    
                                    if ("alias" in action) {
                                        const alias = "remove" in action ? null : action.alias;
                                        unit.methods.setAlias(memberType, action.name, alias);
                                    }
                                    
                                    else if ("rename" in action) {
                                        const keepAlias = "keepAlias" in action ? bool(action.keepAlias) : false;
                                        unit.methods.renameMember(memberType, action.name, action.rename, keepAlias);
                                    }

                                    else if ("remove" in action) {
                                        unit.methods.removeMember(memberType, action.name);
                                    }

                                }

                                else if (action.select === "members" || action.select === "defaultMembers") {
                                    if ("remove" in action) {
                                        unit.methods.removeMembers(action.select);
                                    }

                                    if ("add" in action) {
                                        if (action.select === "members") {
                                            unit.methods.addMember(ensureArray(action.add));
                                        } else if ("add" in action) {
                                            unit.methods.addDefaultMember(ensureArray(action.add));
                                        }
                                    } 
                                }
                            }
                            
                            else if ("remove" in action) {
                                importManager.remove(unit);
                                continue;
                            }

                            importManager.commitChanges(unit);
                        }
                    }
                }
            }

            const code = importManager.code.toString();
            console.log("CODE >>>>");
            console.log(code);
            console.log("<<< CODE");
            
            let map;

            if (options.sourceMap !== false && options.sourcemap !== false) {
                map = importManager.code.generateMap({ hires: true });
            }

            return { code, map };
        }
    };
};
  
export { manager };

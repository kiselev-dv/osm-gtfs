let path = require('path');
let estree = require('estree-walker');
let MagicString = require('magic-string');
let astring = require('astring');
let vm = require('vm');

let vctx = vm.createContext();

function findTopLevelDeclaration (ast, name) {
    return ast.body.some(node => {
        if (node.type === 'VariableDeclaration') {
            if (node.declarations.find(d => d.id.name === name)) {
                return true;
            }
        }

        if (node.type === 'FunctionDeclaration') {
            if (node.id.name === name) {
                return true;
            }
        }

        if (node.type === 'ClassDeclaration') {
            if (node.id.name === name) {
                return true;
            }
        }
    });
}

function findNodeInAst (ast, target) {
    let found;

    estree.walk(ast, {
        enter (node) {
            if (node === target) {
                found = true;
            }
        }
    });

    return found;
}

function exportNames (ast, names, s) {
    let topLevelNames = names.filter(name => findTopLevelDeclaration(ast, name));
    let otherNames = names.filter(name => topLevelNames.indexOf(name) === -1);

    // If a variable is already defined in the top level scope, it will cause
    // a conflict to redefine it again. 
    if (topLevelNames.length > 0) {
        s.append(`
            export { ${topLevelNames.join(', ')} };
        `);
    }

    // If it's not however on the top level, but it has been exported
    // then we need to declare a top level export for it assigning 
    // it to the export.
    if (otherNames.length > 0) {
        s.append(`
            ${otherNames.map(ex => {
                return `export var ${ex} = __module.exports.${ex};`;
            }).join(' ')}
        `);
    }
}

module.exports = function (options = {}) {
    let extensions = (options && options.extensions) || ['.js'];

    return {
        transform: function (code, id) {
            if (extensions.indexOf(path.extname(id)) === -1) {
                return;
            }

            let importIndex = 0;
            let isESModule = false;
            let hasExports = false;
            let hasImports = false;
            let isUsingModule = false;
            let hasESDefaultExport = false; // typeof exports with default export already include, eg. lodash
            let exported = [];

            if (options.define) {
                Object.keys(options.define).forEach(key => {
                    code = code.split(key).join(options.define[key]);
                });
            }
            
            let s = new MagicString(code);
            let ast = this.parse(code);
            
            let ancestors = [];
            estree.walk(ast, {
                enter: (node, parent) => {
                    s.addSourcemapLocation(node.start);
                    s.addSourcemapLocation(node.end);

                    if (node.type === 'CallExpression') {
                        // Each time we find a require call, we add an import statement to the top.
                        // The closest thing in ESM we can map require to is the following:
                        //
                        //     var MyFile = require('myfile') --> import * as __temp from 'myfile';
                        //
                        // We use this syntax because this will make sure that we're not looking for a default property.
                        // The require calls are then replaced with the __temp variable.
                        //
                        if (node.callee.name === 'require') {
                            if (node.arguments.length === 1 && node.arguments[0].type === 'Literal') {   

                                // Before we automatically add the import statement, we need to see 
                                // if this module should be included. This is important because of 
                                // conditional requires that use stuff like process.env to determine
                                // which module should be loaded.                        
                                let shouldInclude = true;

                                ancestors.some((parent, index) => {
                                    // TODO: Temporary workaround for RHL, because if has a condition
                                    // which can't be easily statically parsed and cannot be executed.
                                    //
                                    // --> if (!module.hot || process.env.NODE_ENV === 'production' || !platformSupported)
                                    // 
                                    // Not entirely sure how to parse this.
                                    // 
                                    if (parent.type === 'IfStatement' && parent.test.type === 'BinaryExpression') {
                                        if (parent.test.left.type === 'Literal' && parent.test.right.type === 'Literal') {

                                            shouldInclude = false;

                                            // This is a bit of a hack, but it works for the time being.
                                            // We temporarily swap out the implementation of the if statement
                                            // and execute the if statement and see which branch was activated.
                                            let branch;
                                            let consequent = parent.consequent;
                                            let alternate = parent.alternate;
                                            parent.consequent = this.parse('branch = 0');
                                            parent.alternate = this.parse('branch = 1');

                                            // Running in a VM context prevents branches from checking
                                            // this node's process.env and other globals.
                                            branch = vm.runInContext(`
                                                (function () {
                                                    var branch;
                                                    ${astring.generate(parent)}
                                                    return branch;
                                                })();
                                            `, vctx);

                                            parent.consequent = consequent;
                                            parent.alternate = alternate;

                                            // Once we know which branch executed, we'll see if this require
                                            // call is inside that branch. If it is, import this module, else do nothing.
                                            let branchToCheck = branch === 0? consequent : alternate;

                                            let found = findNodeInAst(branchToCheck, node);

                                            if (found) {
                                                shouldInclude = true;
                                            }

                                            return true;
                                        }
                                    }
                                });

                                if (shouldInclude) {
                                    let importee = node.arguments[0].value;
                                    let tempImportName = '__require__import__' + (importIndex++);
                                    s.overwrite(node.start, node.end, `__interopImport(${tempImportName})`);
                                    s.prepend(`import * as ${tempImportName} from '${importee}';`);
                                    hasImports = true;
                                }

                            }
                        }

                        if (node.callee.object && 
                            node.callee.object.name === 'Object' &&
                            node.callee.property && 
                            node.callee.property.name === 'defineProperty' &&
                            node.arguments &&
                            node.arguments[0] &&
                            node.arguments[0].name === 'exports' &&
                            node.arguments[1] && 
                            node.arguments[1].type === 'Literal'
                        ) {
                            hasExports = true;
                            exported.push(node.arguments[1].value);

                            if (node.arguments[1].value === '__esModule') {
                                isESModule = true;
                            }
                        }
                    }

                    if (node.type === 'AssignmentExpression') {
                        // Convert module.export calls to __exports.
                        // __exports is then exported as the default at the end.
                        // module.exports isn't necessarily on the top level and can be inside
                        // branches, so that's why we use a custom object instead.
                        let left = node.left;

                        if (left.type === 'MemberExpression') {
                            // module.exports.[name] = [data]
                            if (left.object && left.object.object && left.object.object.name === 'module' && left.object.property.name === 'exports') {
                                hasExports = true;

                                if (left.property && left.property.name) {
                                    exported.push(left.property.name);

                                    if (left.property.name === '__esModule') {
                                        isESModule = true;
                                    }
                                }
                            }

                            // module.exports = [data]
                            if (left.object && left.object.name === 'module') {
                                if (left.property && (left.property.name === 'exports' || left.property.value === 'exports')) {
                                    hasExports = true;
                                }
                            }

                            // exports.[name] = [data]
                            if (left.object && left.object.name === 'exports' ) {
                                if (left.property && left.property.name) {
                                    hasExports = true;
                                    exported.push(left.property.name);

                                    if (left.property.name === '__esModule') {
                                        isESModule = true;
                                    }
                                }
                            }
                        }
                    }

                    // object.define(exports) and a(exports.method)
                    if (node.type === 'Identifier' && node.name === 'exports') {
                        if (!parent.object || parent.object === node) {
                            hasExports = true;
                        } 
                    }

                    if (node.type === 'Identifier' && node.name === 'module') {
                        s.overwrite(node.start, node.end, '__module'); 
                        isUsingModule = true;
                    }

                    if (node.type === 'ExportDefaultDeclaration') {
                        hasESDefaultExport = true;
                    }

                    ancestors.push(node);
                },

                leave: (node, parent) => {
                    ancestors.pop();
                }

            });

            if (isUsingModule || hasExports) {
                s.prepend(`
                    var __exports = {}; var exports = __exports; var __module = { exports: __exports };
                    if (typeof module !== "undefined") for (var prop in module) { prop !== "exports" && (__module[prop] = module[prop])};
                `.trim());
            }

            // Because we're exporting a default object, anything that calls require
            // needs to get that default export. We're using default export because 
            // it allows us to output arbitrary variables.
            //
            // However, another situation can come up. What if you require an ES module?
            // If you do, it won't necessarily have a default export. Therefore as a fallback,
            // we return the full module instead of just its default. 
            //
            if (hasImports) {
                s.prepend(`
                    function __interopImport(ex) {
                        if (ex.__esModule) {
                            return ex;
                        }

                        if ('default' in ex) {
                            return ex.default;
                        } 

                        return ex;
                    }
                `)
            }

            // We use default exports because it allows us to export arbitrary code.
            //
            //    module.exports = 'abc';
            //
            // In this example, there's no way to know what to call that export. 
            // With default exports, we don't need to know.
            if (hasExports) {

                if (isESModule) {
                    if (!hasESDefaultExport && exported.filter(e => e === 'default').length > 0) {
                        s.append(';\nexport default __exports.default;');
                    }
                    exported = exported.filter((e, i, a) => e !== 'default' && a.indexOf(e) === i);
                    exportNames(ast, exported, s);
                    if (exported.indexOf('__esModule') === -1) {
                        s.append(';\nvar __esModule = true; export { __esModule };');
                    }
                } else {
                    !hasESDefaultExport && s.append(';\nexport default __module.exports;')
                }

                // Because module.exports is dynamic and allows for arbitrary assignments, everything must 
                // be assigned to default. But that also means named exports don't work because everything
                // is attached to the default export.
                // 
                // To solve this problem, we have to manually specify in the options configuration
                // what files should export what objects. We create an explicit export statement for 
                // each one at the bottom of the file.
                let namedExportFile = id.replace(process.cwd(), '').replace(/\\/g, '/').substring(1);
                if (options && options.namedExports && options.namedExports[namedExportFile]) {
                    let names = options.namedExports[namedExportFile];
                    exportNames(ast, names, s);
                }
            }

            return {
                code: s.toString(),
                map: s.generateMap({ source: id }),
                syntheticNamedExports: !isESModule && hasExports
            };
        }
    }
}

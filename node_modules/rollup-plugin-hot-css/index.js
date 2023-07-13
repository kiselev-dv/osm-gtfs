let fs = require('fs');
let path = require('path');
let csstree = require('css-tree');
let SourceMap = require('source-map');

function getHotModuleCode () {
    return `
        window.__css_reload();
        module && module.hot && module.hot.dispose(window.__css_reload);
        module && module.hot && module.hot.accept(window.__css_reload);
    `;  
}

function extractFilepathFromNode (node) {
    let v = node.value.value.replace(/"|'/g, '').split('?')[0];
    if (v.indexOf('data:') === -1) {
        return v;
    }
}

function createLoaderPipeline (options, assets) {
    let pipeline = [];

    options.loaders.forEach(loader => {
        if (loader === 'scss') {
            pipeline.push((input, id) => {
                let sass = null;
                try {
                    sass = require('sass')
                } catch (e) {
                    if (e.code === 'MODULE_NOT_FOUND') {
                        sass = require('node-sass')
                    }
                }
                let transpiled = sass.renderSync({
                    data: input.code,
                    file: id,
                    outFile: id,
                    sourceMap: true,
                    includePaths: [ path.dirname(id) ]
                });

                return { 
                    code: transpiled.css.toString(),
                    map: transpiled.map.toString(),
                    watchFiles: transpiled.stats.includedFiles || []
                };
            });
        }

        if (loader === 'less') {
            pipeline.push((input, id) => {
                let code, map, watchFiles;
                let transpiled = require('less').render(input.code, {
                    async: false,
                    filename: id,
                    syncImport: true,
                    sourceMap: {
                        sourceMapRootpath: path.dirname(id),
                        sourceMapBasepath: path.dirname(id)
                    },
                }, function (err, input) {
                    if (err) {
                        console.error(err);
                    }

                    code = input.css;
                    map = input.map;
                    watchFiles = input.imports || [];
                });

                return { 
                    code, 
                    map,
                    watchFiles
                };
            });
        }

        if (typeof loader === 'function') {
            pipeline.push(loader);
        }
    });

    if (options.url) {
        pipeline.push((input, id) => {
            let ast = csstree.parse(input.code, { positions: true });
            let map;

            if (input.map) {
                let inputMap = typeof input.map === 'string'? JSON.parse(input.map) : input.map;
                map = new SourceMap.SourceMapConsumer(inputMap);
            }

            csstree.walk(ast, node => {
                if (node.type === 'Url' && node.value.type === 'String') {
                    let relfilepath = extractFilepathFromNode(node);
                    let sourcedir = path.dirname(id);
                    
                    if (relfilepath) {
                        if (input.map) {
                            let sourcefile = map.originalPositionFor(node.loc.start).source;
                            if (sourcefile) {
                                sourcedir = path.resolve(sourcedir, path.dirname(sourcefile));
                            }
                       }

                        let filepath = path.resolve(sourcedir, relfilepath);
                        if (fs.existsSync(filepath)) {
                            assets[filepath] = fs.readFileSync(filepath);
                            node.value.value = `"__ASSET__${filepath}"`;
                        } else {
                            console.warn('File not found: ' + filepath);
                        }
                    }
                }
            });

            return { 
                code: csstree.generate(ast) 
            };
        });
    }

    return pipeline;
}

const SIDE_EFFECT_CODE = 'window.__rollup_plugin_hot_css__ = 123';
const SIDE_EFFECT_CODE_REGEX = new RegExp(SIDE_EFFECT_CODE, 'g');
const SIDE_EFFECT_CODE_REPLACEMENT = 'false';

module.exports = function (options) {
    let files = {};
    let assets = {};
    let output = '';

    let opts = {
        file: options.file || 'styles.css',
        extensions: options.extensions || ['.css', '.scss', '.less'],
        loaders: options.loaders || [],
        hot: options.hot,
        url: options.url !== undefined? options.url : true
    };

    let pipeline = createLoaderPipeline(opts, assets);

    return {
        transform: async function (code, id) {
            if (opts.extensions.indexOf(path.extname(id)) === -1) {
                return;
            }

            let input = { code };
            for (let i = 0; i < pipeline.length; i++) {
                input = await pipeline[i](input, id);

                if (input.watchFiles) {
                    for (let j = 0; j < input.watchFiles.length; j++) {
                        this.addWatchFile(input.watchFiles[j]);
                    }
                }
            }

            files[id] = input.code;

            if (opts.hot) {
                return getHotModuleCode();
            }

            // Note that with Rollup 2, chunkInfo.modules only includes modules
            // that have not been tree-shaken. So if you have modA import modB, and modB
            // only imports CSS and nothing else, modB will not be included in chunkInfo.
            // This is because modB exports no code, so only entry file can be relied on.
            // To bypass this, a side effect is created and replaced before finalising.
            return {
                code: SIDE_EFFECT_CODE,
                moduleSideEffects: true
            };
        },

        renderStart () {
            output = '';
        },

        renderChunk (code, chunkInfo) {
            Object.keys(chunkInfo.modules).filter(fileName => {
                if (files[fileName]) {
                    output += files[fileName] + '\n';
                }
            });

            if (!opts.hot) {
                return code.replace(SIDE_EFFECT_CODE_REGEX, SIDE_EFFECT_CODE_REPLACEMENT);
            }
        },

        generateBundle (outputOptions, bundle) {
            Object.keys(assets).forEach(assetId => {
                // TODO: File type detection, put into a folder rather than root of assets
                let asset_ref = this.emitFile({
                    type: 'asset',
                    source: assets[assetId],
                    name: path.basename(assetId)
                });

                output = output.replace('__ASSET__' + assetId, this.getFileName(asset_ref));
            });

            // TODO: Check for extract mode, loader mode and inline mode
            let css_ref = this.emitFile({
                type: 'asset',
                source: output,
                name: opts.file
            });

            Object.keys(bundle).forEach(fileName => {
                if (bundle[fileName].isEntry && opts.hot) {
                    bundle[fileName].code = `
                        ;(function () {
                            if (typeof window === 'undefined') {
                                return;
                            }

                            window.__css_reload = function () {
                                if (window.__styleLinkTimeout) {
                                    cancelAnimationFrame(window.__styleLinkTimeout);
                                }

                                window.__styleLinkTimeout = requestAnimationFrame(() => {
                                    var link = document.querySelector('link[href*="${this.getFileName(css_ref)}"]');

                                    if (link) {
                                        if (!window.__styleLinkHref) {
                                            window.__styleLinkHref = link.getAttribute('href');
                                        }

                                        var newLink = document.createElement('link');
                                        newLink.setAttribute('rel', 'stylesheet');
                                        newLink.setAttribute('type', 'text/css');
                                        newLink.setAttribute('href', window.__styleLinkHref + '?' + Date.now());
                                        newLink.onload = () => {
                                            link.remove();
                                        };

                                        document.head.appendChild(newLink);
                                    }
                                });
                            }
                        })();
                    ` + bundle[fileName].code;
                }
            });
        }
    }
}

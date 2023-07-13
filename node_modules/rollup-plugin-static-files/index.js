let fs = require('fs-extra');
let path = require('path');
let klawSync = require('klaw-sync');
let cheerio = require('cheerio');

function findMatchingFile (pattern, bundle) {
    for (let file in bundle) {
        if (pattern.test(file)) {
            return file;
        }
    }
}

function normalizedFile(file) {
    return path.resolve(process.cwd(), file);
}

module.exports = function (options) {
    let publicPath = options.publicPath || '/';

    if (!publicPath.startsWith('/')) {
        publicPath = '/' + options.publicPath;
    }

    if (!publicPath.endsWith('/')) {
        publicPath = publicPath + '/';
    }

    return {
        generateBundle (outputOptions, bundle) {
            let target_directory = outputOptions.dir || path.dirname(outputOptions.file);

            (options.include || []).forEach(directory => {
                fs.copySync(directory, target_directory, {
                    filter: includedFile => {
                        const file = normalizedFile(includedFile)
                        return !((options.exclude || [])
                            .find(f => file.startsWith(normalizedFile(f)))
                        )
                    }
                });

                let htmlFiles = klawSync(target_directory, {
                    filter: file => file.path.endsWith('.html')
                });

                htmlFiles.forEach(file => {
                    let content = fs.readFileSync(file.path, 'utf8');
                    let $ = cheerio.load(content);
                    $('script, link').each(function (i, el) {
                        el = $(this);
                        ['src', 'href'].forEach(attr => {
                            let value = el.attr(attr);
                            if (value) {
                                let isAbsolute = value.startsWith('/');

                                if (isAbsolute) {
                                    value = value.replace(publicPath, '');
                                }

                                let pattern = new RegExp(`^${value.replace('[hash]', '([a-f0-9]+)')}$`);
                                let file = findMatchingFile(pattern, bundle);

                                if (file) {
                                    el.attr(attr, isAbsolute? publicPath + file : file);
                                }
                            }
                        });
                    });

                    fs.writeFileSync(file.path, $.html());
                });

            });
        }
    }
}
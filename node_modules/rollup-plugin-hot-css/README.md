# rollup-plugin-hot-css

A generic CSS loader for [Rollup](https://rollupjs.org). Supports Hot Module Replacement when used with [Nollup](https://github.com/PepsRyuu/nollup). If the CSS imports any assets such as images or fonts, those URLs are resolved with assets emitted. 

## How to use

```sh
npm install rollup-plugin-hot-css
```

```js
let hotcss = require('rollup-plugin-hot-css');

module.exports = {
    ...
    plugins: [
        hotcss({
            file: 'styles.css',
            extensions: ['.css', '.scss'],
            loaders: ['scss'],
            hot: true
        })
    ]
}
```

## Options

* ***String* file -** Output file name. Default is ```styles.css```. The final name of this file will be based on ```assetsFileName``` Rollup output option. 

* ***Array<String>* extensions -** Extensions to run the plugin for. Default is ```.css, .scss, .less```

* ***Function* loaders -** Array of preprocessors to run. Can accept either a string or a function. The only supported strings are ```scss``` and ```less``` (note: they must be installed). Passing a custom loader can be done using a function. The function will receive ```input``` and ```id```. ```input``` will contain ```code``` and ```map``` with the code and sourcemap so far. 

* ***Boolean* hot -** Enable hot module replacement using &lt;link&gt; tag. This should be disabled if building for production. Default is ```false```.

* ***Boolean* url -** Enable resolving URLs found in CSS file and export those assets. This will resolve after all other loaders. Sourcemaps must be emitted by the previous loader for this to work. Default is ```true```.

## Loaders

There are two built in loaders: ```scss``` and ```less```. Custom loaders can be specified, as described below:

```js
function MyCustomLoader (input, id) {
    // input.code
    // input.map
    // input.watchFiles

    return {
        code: /* transformed code as a string */,
        map: /* source map */,
        watchFiles: /* optional extra files to watch for changes */
    }
}

hotcss({
    loaders: ['scss', MyCustomLoader]
})
```

Loaders can also be asynchronous by returning a Promise:

```js
function MyCustomLoader (input, id) {
    return new Promise(resolve => ({
        code: /* transformed code as a string */,
        map: /* source map */,
        watchFiles: /* optional extra files to watch for changes */
    }));
}
```

An example using ```postcss```:

```js
let autoprefixer = require('autoprefixer')
let postcss = require('postcss')

function PostCSSLoader (input, id) {
    return postcss([autoprefixer]).process(input.code).then(res => {
        return {
            code: res.css
        };
    });
}

hotcss({
    loaders: ['scss', PostCSSLoader]
})
```

## Hot Module Replacement

The HMR API expects there to be a ```link``` tag inside the ```index.html``` file.

```html
<link rel="stylesheet" type="text/css" href="/styles.css">
```

When file changes are made, the link tag is replaced by appending a timestamp to the end of the ```href```. This forces the browser to download the file again.

Note that the ```href``` is based on the ```assetsFileName``` option. If using Nollup for example, if your ```assetsFileName``` option is set to ```[name].[hash][extname]``` then ```href``` should be set to ```/styles.[hash].css```.


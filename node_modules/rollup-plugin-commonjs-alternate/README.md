# rollup-plugin-commonjs-alternate

Alternative CommonJS plugin for [Rollup](https://rollupjs.org). 
The standard [rollup-plugin-commonjs](https://github.com/rollup/rollup-plugin-commonjs) works very well, but has a few issues:

* It doesn't support conditional requires. This means that both development and production versions of libraries will be both included. This plugin does a simple static check to see if the ```require``` call should be included as an import.

* It doesn't check for ```require``` calls inside ESM files. This doesn't seem like an issue at first, but it's an issue when using libraries such as React Hot Loader which uses a Babel plugin to inject itself into ESM modules.

* It stubs dynamic requires. This is a problem because dynamic requires are necessary for features such as [Hot Module Replacement](https://github.com/PepsRyuu/nollup).

## What does this plugin do?

This aim of this plugin is to support popular front-end libraries that follow best practices and get them working correctly with HMR.
It will remove static analyzable conditional imports, it will check for require calls everywhere, and it won't stub anything it shouldn't.

This plugin will most likely not work libraries that go against best practice (for example, setting a variable to module.exports and adding exports to that).

## Limitations

* Static conditional checking doesn't work for libraries like React Hot Loader. You need to either configure an alias or remove it from your production configuration.

* It will always assume CJS modules are in strict mode.

* Named Exports will not work unless you set it in the plugin configuration. This is just a limitation of using ```module.exports``` and default exports:

```
let React = {
    createElement: ...
    createRef: ...
};

module.exports = React;

// equivalent
export default React;
```

In this example, there's no way to tell what ```React``` is from the ```module.exports``` assignment and what properties it contains. The safest thing we can do is assume it's a default export and assign it to the default key. To access named exports, it has to be explicitly configured.

## Options

***Object* namedExports -** Specify what exports files provide. This allows you to use import named exports instead of being forced to use default imports.

```
commonjs({
    namedExports: {
        'node_modules/react/index.js': [
            'Component',
            'createElement'
        ]
    }
})
```

***Array&lt;String&gt;* extensions -** Specify the extensions of modules that this plugin will transform. Default ```['.js']```.

```
commonjs({
    extensions: ['.js', '.jsx']
})
```

***Object&lt;String, String&gt;* define -** Specify string replacements.

```
commonjs({
    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        '__DEBUG__': JSON.stringify(true)
    }
})
```
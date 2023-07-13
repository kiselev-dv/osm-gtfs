import node_resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import hotcss from 'rollup-plugin-hot-css';
import commonjs from 'rollup-plugin-commonjs-alternate';
import static_files from 'rollup-plugin-static-files';
import { terser } from 'rollup-plugin-terser';
import refresh from 'rollup-plugin-react-refresh';

import nodePolyfills from 'rollup-plugin-polyfill-node';

import copy from 'rollup-plugin-copy';
import markdown from '@jackfranklin/rollup-plugin-markdown';

let config = {
    input: './src/main.js',
    output: {
        dir: 'dist',
        format: 'esm',
        entryFileNames: '[name].[hash].js',
        assetFileNames: '[name].[hash][extname]'
    },
    watch: {
        exclude: ['public/build/**', 'public/images/**']
    },
    plugins: [
        hotcss({
            hot: process.env.NODE_ENV === 'development',
            filename: 'styles.css'
        }),
        babel({
            exclude: 'node_modules/**',
            presets: ["@babel/preset-react"]
        }),
        nodePolyfills(),
        node_resolve(),
        commonjs({
            define: {
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
            }
        }),
        process.env.NODE_ENV === 'development' && refresh(),
        copy({
            targets: [
                { src: 'node_modules/leaflet/dist/images/*', dest: 'public/images' }
            ]
        }),
        markdown({
            exclude: 'README.md',
        })
    ]
}

if (process.env.NODE_ENV === 'production') {
    config.plugins = config.plugins.concat([
        static_files({
            include: ['./public']
        }),
        terser()
    ]);
}

export default config;
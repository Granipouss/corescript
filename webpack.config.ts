import { Configuration } from 'webpack';
import { resolve } from 'path';

export default {
    mode: 'development',
    entry: './js/main.ts',
    output: {
        filename: 'main.js',
        path: resolve(__dirname, 'out'),
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.ts', '.js'],
    },
    externals: [{ 'pixi.js': 'PIXI' }],
    devtool: 'eval-source-map',
} as Configuration;

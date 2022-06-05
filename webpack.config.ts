import { Configuration } from 'webpack';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as CopyWebpackPlugin from 'copy-webpack-plugin';
import { resolve } from 'path';

export default {
    mode: 'development',
    entry: './src/main.ts',
    output: {
        filename: 'main.js',
        path: resolve(__dirname, 'dist'),
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
    externals: {
        'pixi.js': 'PIXI',
        fs: 'commonjs fs',
        path: 'commonjs path',
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './template/index.html',
            inject: 'body',
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: './template',
                    globOptions: { ignore: ['**/index.html'] },
                },
            ],
        }),
    ],
    devtool: 'eval-source-map',
} as Configuration;

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    mode: 'development',
    devtool: 'inline-source-map',
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.(sass|less|css)$/,
                use: ['style-loader', 'css-loader'],
            }
        ],
    },
    devServer: {
        static: {
            directory: path.join(__dirname, "dist")
        },

        historyApiFallback: true,

        hot: true,
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            title: 'Polyhedra',
            template: 'src/index.html',
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ],
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ],
        fallback: {
            'assert': false,
            'process': false,
        }
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
};

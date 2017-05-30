/**
 * Created by Pedro Sereno on 28/05/2017.
 */
var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/main.ts',

    output: {
        path: path.resolve(__dirname, 'docs'),
        filename: '[name].js',
        chunkFilename: '[id].chunk.js'
    },

    resolve: {
        extensions: ['.ts', '.js']
    },

    module: {
        loaders: [
            {
                test: /\.ts$/,
                loader: 'awesome-typescript-loader',
                options: {
                    silent: true
                }
            },
            {
                test: /\.(png|json|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
                loader: 'file-loader?name=assets/[name].[hash].[ext]',
                exclude: /node_modules/
            },
        ]
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html'
        }),
        new CopyWebpackPlugin([
            {
                from: 'src/assets/',
                to: 'assets/'
            }
        ])
    ],

    devServer: {
        historyApiFallback: true,
        stats: 'minimal',
        port: 4200
    }
};
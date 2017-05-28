/**
 * Created by Pedro Sereno on 28/05/2017.
 */
var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/main.ts',

    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: 'http://localhost:8080/',
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
            }
        ]
    },

    plugins: [new HtmlWebpackPlugin({
        template: './src/index.html'
    })],

    devServer: {
        contentBase: path.join(__dirname, "src", "assets"),
        historyApiFallback: true,
        stats: 'minimal',
        port: 8080
    }
};
/*
This Webpack-config builds a version of VsmToRdf that can be used
in the browser, as a global variable.
*/

const path = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');


const src  = path.resolve(__dirname, './src');
const dist = path.resolve(__dirname, './dist');
const addSourceMap = false;


module.exports = (env = {}) => ({

  mode: 'production',

  entry: src + '/index.js',

  devtool: addSourceMap ? 'hidden-source-map' : false,

  module: {
    rules: [
      { test: /\.js$/,
        include: src,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [ '@babel/preset-env', { targets: { esmodules: true } } ] ] }
        }
      }
    ]
  },

  node: { fs: 'empty' },

  plugins: [ new CleanWebpackPlugin() ],

  optimization: {
    minimizer: [ new TerserPlugin({
      sourceMap: addSourceMap,
      parallel: true,
      terserOptions: { ie8: false }
    }) ]
  },

  output: {
    path: dist,
    filename: 'vsm-to-rdf.min.js',
    library: 'VsmToRdf',
    libraryTarget: 'var'
  }
});

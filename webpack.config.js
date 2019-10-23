/*
 * $Id: webpack.config.js 47572 2019-03-22 19:00:31Z robertj $
 */

'use strict';

const path = require('path');
const env = require('yargs').argv.env;
const webpack = require('webpack');
const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
const CleanWebpackPlugin = require('clean-webpack-plugin');

const production = env === 'production';
const libraryName = 'shapes';
const outputFile = libraryName + '.js';

const plugins = [
  new CleanWebpackPlugin(['lib'], { root: __dirname }),
  new webpack.DefinePlugin({
    'process.env': {
      DEBUG: !production,
      RELEASE: production
    }
  })
];

if (production) {
  plugins.push(new UglifyJsPlugin({ minimize: true }));
}

const config = {
  entry: [
    path.resolve(__dirname, 'src/index.js')
  ],

  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: outputFile,
    library: libraryName,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },

  devtool: 'source-map',

  devServer: {
    inline: true,
    disableHostCheck: true,
    contentBase: [
      path.resolve(__dirname, 'test')
    ],
    watchContentBase: true,
    publicPath: '/lib/',
    port: 3040,
    // host: "0.0.0.0",
    overlay: {
      warnings: false,
      errors: true
    },
    // mount SessionServer
    proxy: {
      "/sessionserver": {
        target: 'http://localhost:3090',
        pathRewrite: {"^/sessionserver" : ""}
      }
    }
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'eslint-loader'
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
      {
        test: require.resolve('createjs-easeljs'),
        loader: 'imports-loader?this=>window!exports-loader?createjs=window.createjs',
      },
      {
        test: require.resolve('createjs-tweenjs'),
        loader: 'imports-loader?this=>window!exports-loader?createjs=window.createjs',
      }
    ]
  },

  performance: {
    hints: false
  },

  plugins: plugins,

  resolve: {
    alias: {
      // map EaselJS & TweenJS to their corresponding Node modules
      'EaselJS': path.resolve(__dirname, 'node_modules/createjs-easeljs/lib/easeljs-0.8.2.min.js'),
      'TweenJS': path.resolve(__dirname, 'node_modules/createjs-tweenjs/lib/tweenjs-0.6.0.min.js'),
    }
  },

  externals: {
    "jquery": "jQuery"
  }
};

module.exports = config;

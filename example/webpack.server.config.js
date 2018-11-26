const path = require('path');
const nodeExternals = require('webpack-node-externals');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV,
  target: 'node',
  externals: [nodeExternals()],
  entry: ['./src/index.js'],
  output: {
    path: path.resolve('build'),
    filename: 'index.js'
  },
  node: {
    __dirname: false
  },
  module: {
    rules: [
      {
        test: /\.js$/i,
        loader: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([ 
      {from: 'src/public', to: 'public'},
      {from: 'src/views', to: 'views'}
    ])
  ]
};

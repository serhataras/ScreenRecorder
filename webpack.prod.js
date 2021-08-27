const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WebpackAssetsManifest = require('webpack-assets-manifest');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  output: {
    path: path.join(__dirname, '/dist'),
    filename: 'index_[hash].js'
  },
  plugins: [
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // all options are optional
      filename: '[name]-[hash].css',
      chunkFilename: '[id].css',
      ignoreOrder: false // Enable to remove warnings about conflicting order
    }),
    new WebpackAssetsManifest({
      transform(assets,manifest) {
        const { name, version, hook } = require('./package.json');

        assets.name = name;
        assets.version = version;
        assets.hook = hook;

      }
    }),
    new CopyWebpackPlugin([
      {
        from: 'public/**/*',
        to:'',
      }
    ])
  ]
});

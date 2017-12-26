const webpack = require('webpack');
const path = require('path');
const autoprefixer = require("autoprefixer");

module.exports = [{
  entry: {
    app:     
      [
        'eventsource-polyfill',
        './src/index'
      ]
  },
  output: {
    path: path.join(__dirname, '/public'),
    publicPath: '/',
    filename: 'bundle.js'
  },
  module: {
    rules: [
      { test: /\.js?$/, 
        use: ["babel-loader"], 
        exclude: /node_modules/,
        },
      { test: /\.sass$/, 
        use: [
          'style-loader',
          {loader:'css-loader',
            options:{
              minimize: true
            }
          },
          'postcss-loader',
          'sass-loader'
        ], 
        exclude: /node_modules/ 
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000, /* file smaller than 10kB would be transformed into base64 */
              name: "./assets/images/[name].[ext]",
              // publicPath: "/assets"
            }
          }
        ]
      },
      { 
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        loader: 'url-loader',
        options:{
          limit: 65000,
          mimetype: "application/octet-stream",
          name: "/fonts/[name].[ext]",
          // publicPath: "./assets"          
        } 
      }
    ]
  },
  resolve: {
    extensions: ['.js','.sass', ".jsx"]
  },
  devServer: {
    port: process.env.PORT || 8080,
    host: "localhost",
    contentBase: "./public",
    historyApiFallback: {
      index: ''
    },
    hot: true,
    inline: true
  }
  ,plugins:[
    new webpack.NamedModulesPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.DefinePlugin({ // <-- key to reducing React's size
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    }),
    new webpack.ProvidePlugin({
      React: 'react',
      ReactDOM:'react-dom'
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(), //dedupe similar code 
    new webpack.optimize.UglifyJsPlugin(), //minify everything
    new webpack.optimize.AggressiveMergingPlugin()//Merge chunks 
  ]
}];
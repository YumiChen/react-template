const webpack = require('webpack');
const path = require('path');

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
    filename: 'bundle.js'
    // ,publicPath: '/static/'
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
          'css-loader',
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
              limit: 10000 /* 小於 10kB 的圖片轉成 base64 */
            }
          }
        ]
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
    historyApiFallback: true,
    hot: true,
    inline: true
  },
  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.NoErrorsPlugin()
  ]
}];
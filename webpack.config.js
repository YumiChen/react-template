const webpack = require('webpack')
const path = require('path')

let settings = [{
  entry:
      [
        './src/index'
      ]
  ,
  output: {
    path: path.join(__dirname, 'public'),
    publicPath: '/',
    filename: 'bundle.js'
  },
  module: {
    rules: [
      { test: /\.js?$/,
        use: ['babel-loader'],
        exclude: /node_modules/
      },
      { test: /\.sass$/,
        use: [
          'style-loader',
          { loader: 'css-loader',
            options: {
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
              name: './assets/images/[name].[ext]'
              // publicPath: "/assets"
            }
          }
        ]
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        loader: 'url-loader',
        options: {
          limit: 65000,
          mimetype: 'application/octet-stream',
          name: '/fonts/[name].[ext]'
          // publicPath: "./assets"
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.sass', '.jsx']
  },
  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({ // <-- key to reducing React's size
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    }),
    new webpack.ProvidePlugin({
      React: 'react',
      ReactDOM: 'react-dom'
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.AggressiveMergingPlugin(),//Merge chunks 
  ],
  optimization: {
    minimize: true
  }
}];

// hmr
if(process.env.NODE_ENV && process.env.NODE_ENV.trim() === 'development'){
  settings.forEach(function(settings){
    settings.entry = settings.entry.concat([
      'eventsource-polyfill',
      'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true'
    ]);
    settings.plugins = settings.plugins.concat([    
      new webpack.HotModuleReplacementPlugin()
    ]);
  });
}

module.exports = settings;

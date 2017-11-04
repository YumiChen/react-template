var express = require('express');
var BodyParser = require( 'body-parser' );
var path = require('path');
var router = require('./routes.js');

// App setup
var app = express(),
    port = process.env.port || 7777;
var server = app.listen(port, function(){
    console.log('listening for requests on port ' + port);
});

// Static files
app.use(express.static('public'));


app.use( BodyParser.urlencoded( { extended: false } ) );
app.use( BodyParser.json() );

app.use("/",router);


// var webpack = require('webpack');
// var config = require('./webpack.config');
// var compiler = webpack(config);

// var webpackDevMiddleware = require("webpack-dev-middleware");
// var webpackHotMiddleware = require("webpack-hot-middleware");

// // set hot-reload
// app.use(webpackDevMiddleware(compiler, {
//   hot: true,
//   filename: 'bundle.js',
//   publicPath: config[0].output.publicPath,
//   stats: {
//     colors: true,
//   },
//   historyApiFallback: true,
// }));

// app.use(webpackHotMiddleware(compiler, {
//   log: console.log,
//   path: '/__webpack_hmr',
//   heartbeat: 10 * 1000,
// }));


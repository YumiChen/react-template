var express = require('express');
var BodyParser = require( 'body-parser' );
var router = require('./routes.js');
var compression = require("compression");

// App setup
var app = express(),
    port =process.env.port || process.env.NODE_ENV.trim()==='development'?8080 : 5000;
var server = app.listen(port, function(){
    console.log('listening for requests on port ' + port);
});

// compression
app.use(compression());

// Static files
app.use(express.static('public'));


app.use( BodyParser.urlencoded( { extended: false } ) );
app.use( BodyParser.json() );

app.use("/",router);

// hmr
if(process.env.NODE_ENV.trim() === 'development'){

    var webpack = require('webpack');
    var config = require('./webpack.config');
    var compiler = webpack(config);

    console.log('hmr added');

    var webpackDevMiddleware = require("webpack-dev-middleware");
    var webpackHotMiddleware = require("webpack-hot-middleware");

    // set hot-reload
    app.use(webpackDevMiddleware(compiler, {
    hot: true,
    filename: 'bundle.js',
    publicPath: config[0].output.publicPath,
    stats: {
        colors: true,
    },
    historyApiFallback: true,
    }));

    app.use(webpackHotMiddleware(compiler, {
    log: console.log,
    path: '/__webpack_hmr',
    heartbeat: 10 * 1000,
    }));
}
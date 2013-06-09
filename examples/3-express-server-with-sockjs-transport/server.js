var express = require('express')
  , app = express(app)
  , server = require('http').createServer(app);
var EurecaServer = require('../../').EurecaServer;

//use sockjs instead of engine.io
var eurecaServer = new EurecaServer({ transport: 'sockjs' });

eurecaServer.attach(server);

//functions under "exports" namespace will
//be exposed to client side
eurecaServer.exports.hello = function () {
    console.log('Hello from client');
}

//see browser client side code for index.html content
app.get('/', function (req, res, next) {
    res.sendfile('index.html');
});

server.listen(8000);
var express = require('express')
  , app = express(app)
  , server = require('http').createServer(app);
var Eureca = require('../../');

//use sockjs instead of engine.io
var eurecaServer = new Eureca.Server({ transport: 'sockjs' });

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


console.log('\033[96mlistening on localhost:8000 \033[39m');
server.listen(8000);
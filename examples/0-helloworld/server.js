var http = require('http');
var fs = require('fs');
var server = http.createServer();

// == Eureca.io code goes here
var Eureca = require('../../');

//Create eureca server
//and allow it to call clientEcho remote function 
var eurecaServer = new Eureca.Server({ allow: ['clientEcho'] });

//attach it to http server
eurecaServer.attach(server);

//functions under exports namespace become callable from client side
eurecaServer.exports.serverEcho = function (msg) {
    console.log('Server received', msg);
}

//each time a client is connected we call
eurecaServer.onConnect(function (socket) {
    var client = socket.clientProxy; //get remote client ref

    //call remote clientEcho function 
    client.clientEcho('Hello from server');
})

// == end Eureca.io code

server.on('request', function (request, response) {

    if (request.method === 'GET') {
        if (request.url.split('?')[0] === '/') {
            var filename = __dirname + '/index.html';
            fs.readFile(filename, function (err, data) {
                var text = data.toString();
                response.writeHead(200, { 'Content-Type': 'text/html' });
                response.write(text);
                response.end();
            });
        }
    }

});


console.log('\033[96m'+'Listening on localhost:8080 '+'\033[39m');
server.listen(8080);
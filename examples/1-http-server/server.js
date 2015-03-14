var http = require('http');
var fs = require('fs');

var server = http.createServer();

var Eureca = require('../../');

var eurecaServer = new Eureca.Server();

eurecaServer.attach(server);

//functions under "exports" namespace will
//be exposed to client side
eurecaServer.exports.hello = function () {
    
    console.log('Hello from client');
}


server.on('request', function (request, response) {
    var i;
    
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



console.log('\033[96mlistening on localhost:8000 \033[39m');
server.listen(8000);
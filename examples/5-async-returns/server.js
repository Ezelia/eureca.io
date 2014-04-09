var http = require('http');
var fs = require('fs');

var server = http.createServer();



var EurecaServer = require('../../').EurecaServer;

var eurecaServer = new EurecaServer({allow:['asyncClientHello']});

eurecaServer.attach(server);

//functions under "exports" namespace will
//be exposed to client side
eurecaServer.exports.hello = function () {
    console.log('Hello from client');
}

eurecaServer.exports.asyncServerHello = function () {
	var context = this;
	context.async = true;

	setTimeout(function() {
		
		context.return('Async hello from server');	
	}, 2000);

    var conn = this.connection;
    var client = eurecaServer.getClient(conn.id);
    
    client.asyncClientHello()		
		.onReady(function(r) {
			console.log('client responded : ', r);
		})

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

server.listen(8000);
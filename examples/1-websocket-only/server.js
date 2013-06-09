var EurecaServer = require('../../').EurecaServer;
var eurecaServer = new EurecaServer();

var port = 8000;



eurecaServer.exports.hello = function () {
    console.log('Hello from client');
}

eurecaServer.listen(port);
console.log('Eureca server listening ', port);
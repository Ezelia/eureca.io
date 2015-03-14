exports.Client = require('./lib/EurecaClient.js').Eureca.Client;
exports.Server = require('./lib/EurecaServer.js').Eureca.Server;
exports.Transport = require('./lib/EurecaServer.js').Eureca.Transport;


exports.EurecaServer = (function () {
    

    function F(args) {
        return exports.Server.apply(this, args);
    }
    F.prototype = exports.Server.prototype;

    return function () {
        console.log("/!\\  EurecaServer syntax is deprecated please see http://eureca.io/doc/tutorial-A00-Deprecations.html");
        return new F(arguments);
    }
})();

exports.EurecaClient = (function () {
    

    function F(args) {
        return exports.Client.apply(this, args);
    }
    F.prototype = exports.Client.prototype;

    return function () {
        console.log("/!\\  EurecaClient syntax is deprecated please see http://eureca.io/doc/tutorial-A00-Deprecations.html");
        return new F(arguments);
    }
})();
Eureca = require('./dist/EurecaServer.js');
exports.Client = Eureca.Client;
exports.Protocol = Eureca.Protocol;
exports.Server = Eureca.Server;
exports.Transport = Eureca.Transport;
exports.version = Eureca.version;

exports.EurecaServer = (function () {


    function F(args) {
        return exports.Server.apply(this, args);
    }
    F.prototype = exports.Server.prototype;

    return function () {
        console.warn("/!\\  EurecaServer syntax is deprecated please see http://eureca.io/doc/tutorial-A00-Deprecations.html");
        return new F(arguments);
    }
})();

exports.EurecaClient = (function () {


    function F(args) {
        return exports.Client.apply(this, args);
    }
    F.prototype = exports.Client.prototype;

    return function () {
        console.warn("/!\\  EurecaClient syntax is deprecated please see http://eureca.io/doc/tutorial-A00-Deprecations.html");
        return new F(arguments);
    }
})();

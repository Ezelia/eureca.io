/// <reference path="ISocket.interface.ts" />
/// <reference path="IServer.interface.ts" />
var Eureca;
(function (Eureca) {
    // Class
    var Transport = (function () {
        function Transport() { }
        Transport.transports = {
        };
        Transport.register = function register(name, clientScript, createClient, createServer) {
            if(this.transports[name] !== undefined) {
                return false;
            }
            this.transports[name] = {
                createClient: createClient,
                createServer: createServer,
                script: clientScript
            };
        };
        Transport.get = function get(name) {
            return this.transports[name];
        };
        return Transport;
    })();
    Eureca.Transport = Transport;    
})(Eureca || (Eureca = {}));
//@ sourceMappingURL=Transport.js.map

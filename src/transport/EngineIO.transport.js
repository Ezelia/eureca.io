var Eureca;
(function (Eureca) {
    (function (Transports) {
        (function (EngineIO) {
            var Socket = (function () {
                function Socket(socket) {
                    this.socket = socket;
                    this.request = socket.request;
                    this.id = socket.id;
                    //FIXME : with nodejs 0.10.0 remoteAddress of nodejs clients is undefined (this seems to be a engine.io issue)
                    this.remoteAddress = (socket && socket.request) ? socket.request.connection.remoteAddress : undefined;
                }
                Socket.prototype.send = function (data) {
                    this.socket.send(data);
                };
                Socket.prototype.close = function () {
                    this.socket.close();
                };
                Socket.prototype.onopen = function (callback) {
                    this.socket.on('open', callback);
                };
                Socket.prototype.onmessage = function (callback) {
                    this.socket.on('message', callback);
                };
                Socket.prototype.onclose = function (callback) {
                    this.socket.on('close', callback);
                };
                Socket.prototype.onerror = function (callback) {
                    this.socket.on('error', callback);
                };
                Socket.prototype.ondisconnect = function (callback) {
                    this.socket.onclose = callback;
                };
                return Socket;
            })();
            EngineIO.Socket = Socket;            
            var Server = (function () {
                function Server(engineIOServer) {
                    this.engineIOServer = engineIOServer;
                }
                Server.prototype.onconnect = function (callback) {
                    this.engineIOServer.on('connection', function (iosocket) {
                        var socket = new Socket(iosocket);
                        //Eureca.Util.extend(iosocket, socket);
                        callback(socket);
                    });
                };
                return Server;
            })();
            EngineIO.Server = Server;            
            var createServer = function (hook, options) {
                if (typeof options === "undefined") { options = {
                }; }
                var eioptions = {
                };
                eioptions.path = options.prefix ? '/' + options.prefix : undefined;
                var io = require('engine.io');
                var server;
                var isPort = /^[\d]+$/.test(hook);
                if(isPort) {
                    var port = parseInt(hook);
                    //console.log('standalone on ', port);
                    server = new Server(io.listen(port, eioptions));
                } else if(typeof hook == 'object') {
                    server = new Server(io.attach(hook, eioptions));
                }
                return server;
            };
            var createClient = function (uri, options) {
                if (typeof options === "undefined") { options = {
                }; }
                var eioptions = {
                };
                eioptions.path = options.prefix ? '/' + options.prefix : undefined;
                var socket;
                if(Eureca.Util.isNodejs) {
                    //eioptions.transports = ['websocket', 'polling', 'flashsocket'];
                    console.log('connecting to ', uri, options, eioptions);
                    socket = require('engine.io-client')(uri, eioptions);
                } else {
                    socket = new eio.Socket(uri, eioptions);
                }
                var client = new Socket(socket);
                //(<any>client).send = socket.send;
                //socket.onopen = client.onopen;
                //Eureca.Util.extend(socket, client);
                return client;
            };
            Eureca.Transport.register('engine.io', '/js/engine.io.js', createClient, createServer);
        })(Transports.EngineIO || (Transports.EngineIO = {}));
        var EngineIO = Transports.EngineIO;
    })(Eureca.Transports || (Eureca.Transports = {}));
    var Transports = Eureca.Transports;
})(Eureca || (Eureca = {}));
//@ sourceMappingURL=EngineIO.transport.js.map

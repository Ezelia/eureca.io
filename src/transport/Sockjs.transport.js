var Eureca;
(function (Eureca) {
    (function (Transports) {
        (function (Sockjs) {
            var Socket = (function () {
                function Socket(socket) {
                    this.socket = socket;
                    this.id = socket.id;
                    this.remoteAddress = socket.address ? socket.address.address : undefined;
                }
                Socket.prototype.send = function (data) {
                    if(this.socket.send) {
                        this.socket.send(data);
                    } else {
                        this.socket.write(data);
                    }
                };
                Socket.prototype.close = function () {
                    //throw Error('close() not implemented');
                    this.socket.close();
                };
                Socket.prototype.onopen = function (callback) {
                    if(Eureca.Util.isNodejs) {
                        this.socket.on('connection', function (e) {
                            callback(e);
                        });
                    } else {
                        this.socket.onopen = function (e) {
                            callback(e);
                        };
                    }
                };
                Socket.prototype.onmessage = function (callback) {
                    if(Eureca.Util.isNodejs) {
                        this.socket.on('data', function (e) {
                            callback(e);
                        });
                    } else {
                        this.socket.onmessage = function (e) {
                            callback(e.data);
                        };
                    }
                };
                Socket.prototype.onclose = function (callback) {
                    if(Eureca.Util.isNodejs) {
                        this.socket.on('close', function (e) {
                            callback(e);
                        });
                    } else {
                        this.socket.onclose = function (e) {
                            callback(e);
                        };
                    }
                };
                Socket.prototype.onerror = function (callback) {
                    if(Eureca.Util.isNodejs) {
                        this.socket.on('error', function (e) {
                            callback(e);
                        });
                    } else {
                        this.socket.onerror = function (e) {
                            callback(e);
                        };
                    }
                };
                Socket.prototype.ondisconnect = function (callback) {
                    this.socket.onclose = callback;
                };
                return Socket;
            })();
            Sockjs.Socket = Socket;            
            var Server = (function () {
                function Server(sockjsServer) {
                    this.sockjsServer = sockjsServer;
                }
                Server.prototype.onconnect = function (callback) {
                    this.sockjsServer.on('connection', function (iosocket) {
                        var socket = new Socket(iosocket);
                        callback(socket);
                    });
                };
                return Server;
            })();
            Sockjs.Server = Server;            
            var createServer = function (hook, options) {
                if (typeof options === "undefined") { options = {
                }; }
                var sjsoptions = {
                };
                sjsoptions.prefix = options.prefix ? '/' + options.prefix : undefined;
                var isPort = /^[\d]+$/.test(hook);
                if(isPort) {
                    throw Error('Error - eureca.listen(port) is not implemented on sockjs transport');
                }
                var sockjs = require('sockjs');
                var sockjs_server = sockjs.createServer();
                sockjs_server.installHandlers(hook, sjsoptions);
                var server = new Server(sockjs_server);
                return server;
            };
            var createClient = function (uri, options) {
                if (typeof options === "undefined") { options = {
                }; }
                var sjsoptions = {
                };
                sjsoptions.prefix = options.prefix ? options.prefix : undefined;
                var socket;
                if(Eureca.Util.isNodejs) {
                    socket = require('sockjs-client').create(uri + sjsoptions.prefix);
                } else {
                    socket = new SockJS(uri);
                }
                var client = new Socket(socket);
                return client;
            };
            Eureca.Transport.register('sockjs', '/js/sockjs-0.3.min.js', createClient, createServer);
        })(Transports.Sockjs || (Transports.Sockjs = {}));
        var Sockjs = Transports.Sockjs;
    })(Eureca.Transports || (Eureca.Transports = {}));
    var Transports = Eureca.Transports;
})(Eureca || (Eureca = {}));
//@ sourceMappingURL=Sockjs.transport.js.map

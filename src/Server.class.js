var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var fs = require('fs');
var util = require('util');
var host = '';
function getUrl(req) {
    var scheme = req.headers.referer !== undefined ? req.headers.referer.split(':')[0] : 'http';
    host = scheme + '://' + req.headers.host;
    return host;
}
var hproxywarn = false;
var clientUrl = {
};
var ELog = console;
var Eureca;
(function (Eureca) {
    var Server = (function (_super) {
        __extends(Server, _super);
        function Server(settings) {
            if (typeof settings === "undefined") { settings = {
            }; }
                _super.call(this);
            this.settings = settings;
            this.scriptCache = '';
            this.stub = new Eureca.Stub(settings);
            settings.transport = settings.transport || 'engine.io';
            console.log('* using ' + settings.transport);
            this.transport = Eureca.Transport.get(settings.transport);
            this.contract = [];
            this.debuglevel = settings.debuglevel || 1;
            var _exports = {
            };
            this.exports = Eureca.Contract.proxify(_exports, this.contract);
            this.allowedF = [];
            this.clients = {
            };
            this.registerEvents([
                'onConnect', 
                'onDisconnect', 
                'onMessage', 
                'onError'
            ]);
        }
        Server.prototype.getClient = function (id) {
            var conn = this.clients[id];
            if(conn === undefined) {
                return false;
            }
            if(conn.client !== undefined) {
                return conn.client;
            }
            conn.client = {
            };
            this.stub.importRemoteFunction(conn.client, conn, this.allowedF);
            return conn.client;
        };
        Server.prototype.getConnection = function (id) {
            return this.clients[id];
        };
        Server.prototype.sendScript = function (request, response, prefix) {
            if(this.scriptCache != '') {
                response.writeHead(200);
                response.write(this.scriptCache);
                response.end();
                return;
            }
            this.scriptCache = '';
            this.scriptCache += fs.readFileSync(__dirname + this.transport.script);
            this.scriptCache += '\nvar _eureca_prefix = "' + prefix + '";\n';
            this.scriptCache += '\nvar _eureca_uri = "' + getUrl(request) + '";\n';
            this.scriptCache += '\nvar _eureca_host = "' + getUrl(request) + '";\n';
            this.scriptCache += fs.readFileSync(__dirname + '/EurecaClient.js');
            response.writeHead(200);
            response.write(this.scriptCache);
            response.end();
        };
        Server.prototype._handleServer = function (ioServer) {
            var _this = this;
            ioServer.onconnect(function (socket) {
                socket.eureca = {
                };
                socket.eureca.remoteAddress = socket.remoteAddress;
                _this.clients[socket.id] = socket;
                _this.contract = Eureca.Contract.ensureContract(_this.exports, _this.contract);
                socket.send(JSON.stringify({
                    __eureca__: _this.contract
                }));
                _this.trigger('onConnect', socket);
                socket.onmessage(function (message) {
                    _this.trigger('onMessage', message);
                    var jobj;
                    try  {
                        jobj = JSON.parse(message);
                    } catch (ex) {
                    }
                    ;
                    if(jobj === undefined) {
                        return;
                    }
                    if(jobj.f !== undefined) {
                        var context = {
                            user: {
                                clientId: socket.id
                            },
                            connection: socket
                        };
                        _this.stub.invoke(context, _this, jobj, socket);
                        return;
                    }
                    if(jobj._r !== undefined) {
                        _this.stub.doCallBack(jobj._r, jobj.r);
                        return;
                    }
                });
                socket.onerror(function (e) {
                    _this.trigger('onError', e);
                });
                socket.onclose(function () {
                    _this.trigger('onDisconnect', socket);
                    delete _this.clients[socket.id];
                });
            });
        };
        Server.prototype._checkHarmonyProxies = function () {
            if(typeof Proxy == 'undefined' && !hproxywarn) {
                ELog.log('!!WARNING!! !!WARNING!! !!WARNING!! !!WARNING!! !!WARNING!! !!WARNING!! !!WARNING!!  ', '', '');
                ELog.log('I', 'Harmony proxy not found', 'using workaround');
                ELog.log('I', 'to avoid this message please use : node --harmony-proxies <app>', '');
                ELog.log('=====================================================================================', '', '');
                hproxywarn = true;
            }
        };
        Server.prototype.listen = function (port) {
            this._checkHarmonyProxies();
            this.allowedF = this.settings.allow || [];
            var _prefix = this.settings.prefix || 'eureca.io';
            var ioServer = this.transport.createServer(port, {
                path: '/' + _prefix
            });
            var _this = this;
            this._handleServer(ioServer);
        };
        Server.prototype.installSockJs = function (server, options) {
            var sockjs = require('sockjs');
            var sockjs_server = sockjs.createServer();
            sockjs_server.installHandlers(server, options);
        };
        Server.prototype.attach = function (server) {
            var app = server;
            if(server._events.request !== undefined && server.routes === undefined) {
                app = server._events.request;
            }
            this._checkHarmonyProxies();
            this.allowedF = this.settings.allow || [];
            var _prefix = this.settings.prefix || 'eureca.io';
            var _clientUrl = this.settings.clientScript || '/eureca.js';
            var ioServer = this.transport.createServer(server, {
                prefix: _prefix
            });
            var _this = this;
            this._handleServer(ioServer);
            if(app.get) {
                app.get(_clientUrl, function (request, response) {
                    _this.sendScript(request, response, _prefix);
                });
            } else {
                app.on('request', function (request, response) {
                    if(request.method === 'GET') {
                        if(request.url.split('?')[0] === _clientUrl) {
                            _this.sendScript(request, response, _prefix);
                        }
                    }
                });
            }
        };
        return Server;
    })(Eureca.EObject);
    Eureca.Server = Server;    
})(Eureca || (Eureca = {}));
exports.Eureca = Eureca;
//@ sourceMappingURL=Server.class.js.map

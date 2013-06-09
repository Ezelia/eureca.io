var Eureca;
(function (Eureca) {
    var EObject = (function () {
        function EObject() {
        }
        EObject.prototype.extend = function (options) {
            if(options) {
                for(var key in options) {
                    this[key] = options[key];
                }
            }
        };
        EObject.prototype.bind = function (event, fct) {
            this._events = this._events || {
            };
            this._events[event] = this._events[event] || [];
            this._events[event].push(fct);
        };
        EObject.prototype.unbind = function (event, fct) {
            this._events = this._events || {
            };
            if(event in this._events === false) {
                return;
            }
            this._events[event].splice(this._events[event].indexOf(fct), 1);
        };
        EObject.prototype.unbindEvent = function (event) {
            this._events = this._events || {
            };
            this._events[event] = [];
        };
        EObject.prototype.unbindAll = function () {
            this._events = this._events || {
            };
            for(var event in this._events) {
                this._events[event] = false;
            }
        };
        EObject.prototype.trigger = function (event) {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                args[_i] = arguments[_i + 1];
            }
            this._events = this._events || {
            };
            if(event in this._events === false) {
                return;
            }
            for(var i = 0; i < this._events[event].length; i++) {
                this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
            }
        };
        EObject.prototype.registerEvent = function (evtname) {
            this[evtname] = function (callback, replace) {
                if(typeof callback == 'function') {
                    if(replace) {
                        this.unbindEvent(evtname);
                    }
                    this.bind(evtname, callback);
                }
                return this;
            };
        };
        EObject.prototype.registerEvents = function (eventsArray) {
            for(var i = 0; i < eventsArray.length; i++) {
                this.registerEvent(eventsArray[i]);
            }
        };
        return EObject;
    })();
    Eureca.EObject = EObject;    
})(Eureca || (Eureca = {}));
var Eureca;
(function (Eureca) {
    var Util = (function () {
        function Util() { }
        Util.isNodejs = (typeof exports == 'object' && exports);
        Util.extend = function extend(target, extension) {
            if(target && extension) {
                for(var key in extension) {
                    target[key] = extension[key];
                }
            }
        };
        Util.randomStr = function randomStr(length) {
            if (typeof length === "undefined") { length = 10; }
            var rs, i, nextIndex, l, chars = [
                'a', 
                'b', 
                'c', 
                'd', 
                'e', 
                'f', 
                'g', 
                'h', 
                'i', 
                'j', 
                'k', 
                'l', 
                'm', 
                'n', 
                'o', 
                'p', 
                'q', 
                'r', 
                's', 
                't', 
                'u', 
                'v', 
                'w', 
                'x', 
                'y', 
                'z', 
                'A', 
                'B', 
                'C', 
                'D', 
                'E', 
                'F', 
                'G', 
                'H', 
                'I', 
                'J', 
                'K', 
                'L', 
                'M', 
                'N', 
                'O', 
                'P', 
                'Q', 
                'R', 
                'S', 
                'T', 
                'U', 
                'V', 
                'W', 
                'X', 
                'Y', 
                'Z', 
                '1', 
                '2', 
                '3', 
                '4', 
                '5', 
                '6', 
                '7', 
                '8', 
                '9', 
                '0'
            ];
            rs = '';
            for(i = 0; i < length; i++) {
                nextIndex = Math.floor(Math.random() * chars.length);
                rs += chars[nextIndex];
            }
            return rs;
        };
        return Util;
    })();
    Eureca.Util = Util;    
})(Eureca || (Eureca = {}));
var Eureca;
(function (Eureca) {
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
var Eureca;
(function (Eureca) {
    (function (Transports) {
        (function (EngineIO) {
            var Socket = (function () {
                function Socket(socket) {
                    this.socket = socket;
                    this.request = socket.request;
                    this.id = socket.id;
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
                    console.log('connecting to ', uri, options, eioptions);
                    socket = require('engine.io-client')(uri, eioptions);
                } else {
                    socket = new eio.Socket(uri, eioptions);
                }
                var client = new Socket(socket);
                return client;
            };
            Eureca.Transport.register('engine.io', '/js/engine.io.js', createClient, createServer);
        })(Transports.EngineIO || (Transports.EngineIO = {}));
        var EngineIO = Transports.EngineIO;
    })(Eureca.Transports || (Eureca.Transports = {}));
    var Transports = Eureca.Transports;
})(Eureca || (Eureca = {}));
var Eureca;
(function (Eureca) {
    var Stub = (function () {
        function Stub(settings) {
            if (typeof settings === "undefined") { settings = {
            }; }
            this.settings = settings;
            this.callbacks = {
            };
        }
        Stub.prototype.registerCallBack = function (sig, cb) {
            this.callbacks[sig] = cb;
        };
        Stub.prototype.doCallBack = function (sig, result) {
            if(!sig) {
                return;
            }
            var proxyObj = this.callbacks[sig];
            delete this.callbacks[sig];
            if(proxyObj !== undefined) {
                proxyObj.callback(result);
            }
        };
        Stub.prototype.importRemoteFunction = function (handle, socket, functions) {
            var _this = this;
            if(functions === undefined) {
                return;
            }
            for(var i = 0; i < functions.length; i++) {
                (function (idx, fname) {
                    var proxy = handle;
                    var ftokens = fname.split('.');
                    for(var i = 0; i < ftokens.length - 1; i++) {
                        proxy[ftokens[i]] = proxy[ftokens[i]] || {
                        };
                        proxy = proxy[ftokens[i]];
                    }
                    var _fname = ftokens[ftokens.length - 1];
                    proxy[_fname] = function () {
                        var proxyObj = {
                            callback: function () {
                            },
                            onReady: function (fn) {
                                if(typeof fn == 'function') {
                                    this.callback = fn;
                                }
                            }
                        };
                        var RMIObj = {
                        };
                        var argsArray = Array.prototype.slice.call(arguments, 0);
                        var uid = Eureca.Util.randomStr();
                        _this.registerCallBack(uid, proxyObj);
                        RMIObj.f = _this.settings.useIndexes ? idx : fname;
                        RMIObj._r = uid;
                        if(argsArray.length > 0) {
                            RMIObj.a = argsArray;
                        }
                        socket.send(JSON.stringify(RMIObj));
                        return proxyObj;
                    };
                })(i, functions[i]);
            }
        };
        Stub.prototype.invoke = function (context, handle, obj, socket) {
            var fId = parseInt(obj.f);
            var fname = isNaN(fId) ? obj.f : handle.contract[fId];
            var ftokens = fname.split('.');
            var func = handle.exports;
            for(var i = 0; i < ftokens.length; i++) {
                func = func[ftokens[i]];
            }
            if(typeof func != 'function') {
                console.log('Invoke error', obj.f + ' is not a function', '');
                return;
            }
            try  {
                obj.a = obj.a || [];
                var result = func.apply(context, obj.a);
                if(socket && obj._r) {
                    socket.send(JSON.stringify({
                        _r: obj._r,
                        r: result
                    }));
                }
                obj.a.unshift(socket);
                if(typeof func.onCall == 'function') {
                    func.onCall.apply(context, obj.a);
                }
            } catch (ex) {
                console.log('EURECA Invoke exception!! ', ex.stack);
            }
        };
        return Stub;
    })();
    Eureca.Stub = Stub;    
})(Eureca || (Eureca = {}));
var Eureca;
(function (Eureca) {
    var Contract = (function () {
        function Contract() {
        }
        Contract.handlerMaker = function handlerMaker(obj, contract) {
            return {
                getOwnPropertyDescriptor: function (name) {
                    var desc = Object.getOwnPropertyDescriptor(obj, name);
                    if(desc !== undefined) {
                        desc.configurable = true;
                    }
                    return desc;
                },
                getPropertyDescriptor: function (name) {
                    var desc = (Object).getPropertyDescriptor(obj, name);
                    if(desc !== undefined) {
                        desc.configurable = true;
                    }
                    return desc;
                },
                getOwnPropertyNames: function () {
                    return Object.getOwnPropertyNames(obj);
                },
                getPropertyNames: function () {
                    return (Object).getPropertyNames(obj);
                },
                defineProperty: function (name, desc) {
                    Object.defineProperty(obj, name, desc);
                },
                delete: function (name) {
                    return delete obj[name];
                },
                fix: function () {
                    if(Object.isFrozen(obj)) {
                        var result = {
                        };
                        Object.getOwnPropertyNames(obj).forEach(function (name) {
                            result[name] = Object.getOwnPropertyDescriptor(obj, name);
                        });
                        return result;
                    }
                    return undefined;
                },
                has: function (name) {
                    return name in obj;
                },
                hasOwn: function (name) {
                    return ({
                    }).hasOwnProperty.call(obj, name);
                },
                get: function (receiver, name) {
                    return obj[name];
                },
                set: function (receiver, name, val) {
                    console.log('    Contract +=', name);
                    contract.push(name);
                    obj[name] = val;
                    return true;
                },
                enumerate: function () {
                    var result = [];
                    for(var name in obj) {
                        result.push(name);
                    }
                    ;
                    return result;
                },
                keys: function () {
                    return Object.keys(obj);
                }
            };
        };
        Contract.proxify = function proxify(target, contract) {
            if(typeof Proxy == 'undefined') {
                return target;
            }
            return Proxy.create((Contract).handlerMaker(target, contract));
        };
        Contract.parseNS = function parseNS(target, ns, parent) {
            if (typeof ns === "undefined") { ns = []; }
            if (typeof parent === "undefined") { parent = ''; }
            for(var prop in target) {
                if(typeof target[prop] == 'function') {
                    ns.push(parent + prop);
                } else {
                    Contract.parseNS(target[prop], ns, parent + prop + '.');
                }
            }
            return ns;
        };
        Contract.ensureContract = function ensureContract(target, contract) {
            var contract = this.parseNS(target);
            return contract;
        };
        return Contract;
    })();
    Eureca.Contract = Contract;    
})(Eureca || (Eureca = {}));
exports.Eureca = Eureca;
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

var Eureca;
(function (Eureca) {
    var EObject = (function () {
        function EObject() {
        }
        // Dynamic extend
        EObject.prototype.extend = function (options) {
            if (options) {
                for (var key in options)
                    this[key] = options[key];
            }
        };

        // Events primitives ======================
        EObject.prototype.bind = function (event, fct) {
            this._events = this._events || {};
            this._events[event] = this._events[event] || [];
            this._events[event].push(fct);
        };
        EObject.prototype.on = function (event, fct) {
            this._events = this._events || {};
            this._events[event] = this._events[event] || [];
            this._events[event].push(fct);
        };
        EObject.prototype.unbind = function (event, fct) {
            this._events = this._events || {};
            if (event in this._events === false)
                return;
            this._events[event].splice(this._events[event].indexOf(fct), 1);
        };
        EObject.prototype.unbindEvent = function (event) {
            this._events = this._events || {};
            this._events[event] = [];
        };
        EObject.prototype.unbindAll = function () {
            this._events = this._events || {};
            for (var event in this._events)
                this._events[event] = false;
        };
        EObject.prototype.trigger = function (event) {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                args[_i] = arguments[_i + 1];
            }
            this._events = this._events || {};
            if (event in this._events === false)
                return;
            for (var i = 0; i < this._events[event].length; i++) {
                this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
            }
        };
        EObject.prototype.registerEvent = function (evtname) {
            this[evtname] = function (callback, replace) {
                if (typeof callback == 'function') {
                    if (replace)
                        this.unbindEvent(evtname);

                    this.bind(evtname, callback);
                }

                return this;
            };
        };
        EObject.prototype.registerEvents = function (eventsArray) {
            for (var i = 0; i < eventsArray.length; i++)
                this.registerEvent(eventsArray[i]);
        };
        return EObject;
    })();
    Eureca.EObject = EObject;
})(Eureca || (Eureca = {}));
var Eureca;
(function (Eureca) {
    // Class
    var Util = (function () {
        function Util() {
        }
        Util.extend = function (target, extension) {
            if (target && extension) {
                for (var key in extension)
                    target[key] = extension[key];
            }
        };

        //Borrowed from RMI.js https://github.com/mmarcon/rmi.js
        Util.randomStr = function (length) {
            if (typeof length === "undefined") { length = 10; }
            var rs, i, nextIndex, l, chars = [
                'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
                'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
                '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

            rs = '';
            for (i = 0; i < length; i++) {
                nextIndex = Math.floor(Math.random() * chars.length);
                rs += chars[nextIndex];
            }
            return rs;
        };
        Util.isNodejs = (typeof exports == 'object' && exports);
        return Util;
    })();
    Eureca.Util = Util;
})(Eureca || (Eureca = {}));
/// <reference path="ISocket.interface.ts" />
/// <reference path="ISocket.interface.ts" />
/// <reference path="IServer.interface.ts" />
var Eureca;
(function (Eureca) {
    // Class
    var Transport = (function () {
        function Transport() {
        }
        Transport.register = function (name, clientScript, createClient, createServer) {
            if (this.transports[name] !== undefined)
                return false;

            this.transports[name] = {
                createClient: createClient,
                createServer: createServer,
                script: clientScript
            };
        };
        Transport.get = function (name) {
            return this.transports[name];
        };
        Transport.transports = {};
        return Transport;
    })();
    Eureca.Transport = Transport;
})(Eureca || (Eureca = {}));
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../EObject.class.ts" />
/// <reference path="../Util.class.ts" />
/// <reference path="../Transport.ts" />
/// <reference path="../IServer.interface.ts" />
/// <reference path="../ISocket.interface.ts" />

var Eureca;
(function (Eureca) {
    (function (Transports) {
        (function (PrimusTransport) {
            if (Eureca.Util.isNodejs) {
                Primus = require('primus');
            }

            var Socket = (function (_super) {
                __extends(Socket, _super);
                function Socket(socket) {
                    _super.call(this);
                    this.socket = socket;
                    this.request = socket.request;
                    this.id = socket.id;

                    //FIXME : with nodejs 0.10.0 remoteAddress of nodejs clients is undefined (this seems to be a engine.io issue)
                    this.remoteAddress = socket.address;

                    this.registerEvents(['open', 'message', 'error', 'close', 'reconnecting']);

                    this.bindEvents();
                }
                Socket.prototype.bindEvents = function () {
                    var _this = this;
                    this.socket.on('open', function () {
                        var args = arguments.length > 0 ? Array.prototype.slice.call(arguments, 0) : [];
                        args.unshift('open');
                        _this.trigger.apply(_this, args);
                    });

                    this.socket.on('data', function () {
                        var args = arguments.length > 0 ? Array.prototype.slice.call(arguments, 0) : [];
                        args.unshift('message');
                        _this.trigger.apply(_this, args);
                    });

                    this.socket.on('end', function () {
                        var args = arguments.length > 0 ? Array.prototype.slice.call(arguments, 0) : [];
                        args.unshift('close');
                        _this.trigger.apply(_this, args);
                    });

                    this.socket.on('error', function () {
                        var args = arguments.length > 0 ? Array.prototype.slice.call(arguments, 0) : [];
                        args.unshift('error');
                        _this.trigger.apply(_this, args);
                    });

                    this.socket.on('reconnecting', function () {
                        var args = arguments.length > 0 ? Array.prototype.slice.call(arguments, 0) : [];
                        args.unshift('reconnecting');
                        _this.trigger.apply(_this, args);
                    });
                };

                Socket.prototype.send = function (data) {
                    if (this.socket.send) {
                        this.socket.send(data);
                    } else {
                        this.socket.write(data);
                    }
                };
                Socket.prototype.close = function () {
                    if (this.socket.end) {
                        this.socket.end();
                    } else {
                        this.socket.close();
                    }
                };
                Socket.prototype.onopen = function (callback) {
                    this.socket.on('open', callback);
                };
                Socket.prototype.onmessage = function (callback) {
                    this.socket.on('data', callback);
                };
                Socket.prototype.onclose = function (callback) {
                    this.socket.on('end', callback);
                };
                Socket.prototype.onerror = function (callback) {
                    this.socket.on('error', callback);
                };
                Socket.prototype.ondisconnect = function (callback) {
                    this.socket.on('reconnecting', callback);
                };
                return Socket;
            })(Eureca.EObject);
            PrimusTransport.Socket = Socket;
            var Server = (function () {
                function Server(primus) {
                    this.primus = primus;
                }
                Server.prototype.onconnect = function (callback) {
                    this.primus.on('connection', function (psocket) {
                        var socket = new Socket(psocket);

                        //Eureca.Util.extend(iosocket, socket);
                        callback(socket);
                    });
                };
                return Server;
            })();
            PrimusTransport.Server = Server;

            var createServer = function (hook, options) {
                if (typeof options === "undefined") { options = {}; }
                try  {
                    //var primusOptions: any = {};
                    options.pathname = options.prefix ? '/' + options.prefix : undefined;
                    var primus = new Primus(hook, options);
                    primus.save(__dirname + '/js/primus.js');
                    var server = new Server(primus);

                    return server;
                } catch (ex) {
                    if (ex.name == 'PrimusError' && ex.message.indexOf('Missing dependencies') == 0) {
                        console.error('Missing ', options.transformer);
                        process.exit();
                    } else {
                        throw ex;
                    }
                }
            };

            var createClient = function (uri, options) {
                if (typeof options === "undefined") { options = {}; }
                options.pathname = options.prefix ? '' + options.prefix : undefined;
                options.path = options.prefix ? '/' + options.prefix : undefined;
                var socket;
                if (Eureca.Util.isNodejs) {
                    //eioptions.transports = ['websocket', 'polling', 'flashsocket'];
                    //console.log('connecting to ', uri, options);
                    var CSocket = Primus.createSocket(options);

                    socket = new CSocket(uri);
                } else {
                    console.log('>>> Ezelia : createClient', uri, options);
                    socket = new Primus(uri, options);
                }
                var client = new Socket(socket);

                //(<any>client).send = socket.send;
                //socket.onopen = client.onopen;
                //Eureca.Util.extend(socket, client);
                return client;
            };
            Eureca.Transport.register('primus', '/js/primus.js', createClient, createServer);
        })(Transports.PrimusTransport || (Transports.PrimusTransport = {}));
        var PrimusTransport = Transports.PrimusTransport;
    })(Eureca.Transports || (Eureca.Transports = {}));
    var Transports = Eureca.Transports;
})(Eureca || (Eureca = {}));
var Eureca;
(function (Eureca) {
    var Protocol = (function () {
        function Protocol() {
        }
        Protocol.contractId = '__eureca__';
        Protocol.functionId = 'f';
        Protocol.argsId = 'a';
        Protocol.resultId = 'r';
        Protocol.signatureId = '_r';
        return Protocol;
    })();
    Eureca.Protocol = Protocol;
})(Eureca || (Eureca = {}));
/// <reference path="Protocol.config.ts" />
/// <reference path="Util.class.ts" />
// Module
var Eureca;
(function (Eureca) {
    // Class
    var Stub = (function () {
        // Constructor
        function Stub(settings) {
            if (typeof settings === "undefined") { settings = {}; }
            this.settings = settings;
            this.callbacks = {};
        }
        Stub.prototype.registerCallBack = function (sig, cb) {
            this.callbacks[sig] = cb;
        };
        Stub.prototype.doCallBack = function (sig, result) {
            if (!sig)
                return;
            var proxyObj = this.callbacks[sig];
            delete this.callbacks[sig];
            if (proxyObj !== undefined)
                proxyObj.callback(result);
        };

        Stub.prototype.importRemoteFunction = function (handle, socket, functions) {
            //TODO : improve this using cache
            var _this = this;
            if (functions === undefined)
                return;
            for (var i = 0; i < functions.length; i++) {
                (function (idx, fname) {
                    var proxy = handle;

                    /* namespace parsing */
                    var ftokens = fname.split('.');
                    for (var i = 0; i < ftokens.length - 1; i++) {
                        proxy[ftokens[i]] = proxy[ftokens[i]] || {};
                        proxy = proxy[ftokens[i]];
                    }
                    var _fname = ftokens[ftokens.length - 1];

                    /* end namespace parsing */
                    //TODO : do we need to re generate proxy function if it's already declared ?
                    proxy[_fname] = function () {
                        //TODO : register signature ID to be able to trigger result later.
                        var proxyObj = {
                            /* TODO : save uid/sig here*/
                            callback: function () {
                            },
                            onReady: function (fn) {
                                if (typeof fn == 'function') {
                                    this.callback = fn;
                                }
                            }
                        };

                        var RMIObj = {};

                        var argsArray = Array.prototype.slice.call(arguments, 0);
                        var uid = Eureca.Util.randomStr();

                        _this.registerCallBack(uid, proxyObj);

                        RMIObj[Eureca.Protocol.functionId] = _this.settings.useIndexes ? idx : fname;
                        RMIObj[Eureca.Protocol.signatureId] = uid;
                        if (argsArray.length > 0)
                            RMIObj[Eureca.Protocol.argsId] = argsArray;
                        socket.send(JSON.stringify(RMIObj));

                        return proxyObj;
                    };
                })(i, functions[i]);
            }
        };

        Stub.prototype.invoke = function (context, handle, obj, socket) {
            var fId = parseInt(obj[Eureca.Protocol.functionId]);
            var fname = isNaN(fId) ? obj[Eureca.Protocol.functionId] : handle.contract[fId];

            /* browing namespace */
            var ftokens = fname.split('.');
            var func = handle.exports;
            for (var i = 0; i < ftokens.length; i++)
                func = func[ftokens[i]];

            /* ***************** */
            //var func = this.exports[fname];
            if (typeof func != 'function') {
                //socket.send('Invoke error');
                console.log('Invoke error', obj[Eureca.Protocol.functionId] + ' is not a function', '');
                return;
            }

            try  {
                obj[Eureca.Protocol.argsId] = obj[Eureca.Protocol.argsId] || [];
                var result = func.apply(context, obj[Eureca.Protocol.argsId]);

                //console.log('sending back result ', result, obj)
                if (socket && obj[Eureca.Protocol.signatureId] && !context.async) {
                    var retObj = {};
                    retObj[Eureca.Protocol.signatureId] = obj[Eureca.Protocol.signatureId];
                    retObj[Eureca.Protocol.resultId] = result;

                    socket.send(JSON.stringify(retObj));
                }

                obj[Eureca.Protocol.argsId].unshift(socket);
                if (typeof func.onCall == 'function')
                    func.onCall.apply(context, obj[Eureca.Protocol.argsId]);
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
        // Constructor
        function Contract() {
        }
        Contract.handlerMaker = function (obj, contract) {
            return {
                getOwnPropertyDescriptor: function (name) {
                    var desc = Object.getOwnPropertyDescriptor(obj, name);

                    // a trapping proxy's properties must always be configurable
                    if (desc !== undefined) {
                        desc.configurable = true;
                    }
                    return desc;
                },
                getPropertyDescriptor: function (name) {
                    var desc = Object.getPropertyDescriptor(obj, name);

                    // a trapping proxy's properties must always be configurable
                    if (desc !== undefined) {
                        desc.configurable = true;
                    }
                    return desc;
                },
                getOwnPropertyNames: function () {
                    return Object.getOwnPropertyNames(obj);
                },
                getPropertyNames: function () {
                    return Object.getPropertyNames(obj);
                },
                defineProperty: function (name, desc) {
                    Object.defineProperty(obj, name, desc);
                },
                delete: function (name) {
                    return delete obj[name];
                },
                fix: function () {
                    if (Object.isFrozen(obj)) {
                        var result = {};
                        Object.getOwnPropertyNames(obj).forEach(function (name) {
                            result[name] = Object.getOwnPropertyDescriptor(obj, name);
                        });
                        return result;
                    }

                    // As long as obj is not frozen, the proxy won't allow itself to be fixed
                    return undefined;
                },
                has: function (name) {
                    return name in obj;
                },
                hasOwn: function (name) {
                    return ({}).hasOwnProperty.call(obj, name);
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
                    for (var name in obj) {
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
        Contract.proxify = function (target, contract) {
            if (typeof Proxy == 'undefined')
                return target;

            //ELog.log('I', 'Harmony proxy', 'Enabled');
            return Proxy.create(Contract.handlerMaker(target, contract));
        };

        Contract.parseNS = function (target, ns, parent) {
            if (typeof ns === "undefined") { ns = []; }
            if (typeof parent === "undefined") { parent = ''; }
            for (var prop in target) {
                //console.log('parsing prop', parent+prop, typeof target[prop]);
                if (typeof target[prop] == 'function') {
                    ns.push(parent + prop);
                } else {
                    //FIXME : will crash if sub NS has no children : example : exports.id = 'hello'
                    Contract.parseNS(target[prop], ns, parent + prop + '.');
                }
                //contract.push(prop);
            }
            return ns;
        };
        Contract.ensureContract = function (target, contract) {
            var contract = this.parseNS(target);

            //console.log('ns = ', contract);
            /*
            if (typeof Proxy == 'undefined') {
            contract = [];
            for (var prop in target) {
            contract.push(prop);
            }
            }
            */
            return contract;
        };
        return Contract;
    })();
    Eureca.Contract = Contract;
})(Eureca || (Eureca = {}));

exports.Eureca = Eureca;
/// <reference path="transport/Primus.transport.ts" />
/// <reference path="Transport.ts" />
/// <reference path="Stub.ts" />
/// <reference path="EObject.class.ts" />
/// <reference path="Contract.class.ts" />

var fs = require('fs');

//var EProxy = require('./EurecaProxy.class.js').Eureca.EurecaProxy;
//var io = require('engine.io');
var util = require('util');

var host = '';
function getUrl(req) {
    var scheme = req.headers.referer !== undefined ? req.headers.referer.split(':')[0] : 'http';
    host = scheme + '://' + req.headers.host;
    return host;
}

var hproxywarn = false;

var clientUrl = {};
var ELog = console;

var Eureca;
(function (Eureca) {
    // Class
    var Server = (function (_super) {
        __extends(Server, _super);
        // Constructor
        function Server(settings) {
            if (typeof settings === "undefined") { settings = {}; }
            _super.call(this);
            this.settings = settings;
            this.version = '0.6.0-dev';
            this.scriptCache = '';

            this.stub = new Eureca.Stub(settings);

            settings.transformer = settings.transport || 'engine.io';
            settings.transport = 'primus';

            console.log('* using primus:' + settings.transformer);

            this.transport = Eureca.Transport.get(settings.transport);

            this.contract = [];
            this.debuglevel = settings.debuglevel || 1;

            var _exports = {};
            this.exports = Eureca.Contract.proxify(_exports, this.contract);
            this.allowedF = [];

            this.clients = {};

            if (typeof this.settings.authenticate == 'function')
                this.exports.authenticate = this.settings.authenticate;

            this.registerEvents(['onConnect', 'onDisconnect', 'onMessage', 'onError']);
        }
        Server.prototype.getClient = function (id) {
            var conn = this.clients[id];
            if (conn === undefined)
                return false;
            if (conn.client !== undefined)
                return conn.client;
            conn.client = {};

            //this.importClientFunction(conn.client, conn, this.allowedF);
            this.stub.importRemoteFunction(conn.client, conn, this.allowedF);
            return conn.client;
        };

        Server.prototype.getConnection = function (id) {
            return this.clients[id];
        };

        Server.prototype.sendScript = function (request, response, prefix) {
            if (this.scriptCache != '') {
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

            //FIXME : override primus hardcoded pathname
            this.scriptCache += '\nPrimus.prototype.pathname = "/' + prefix + '";\n';
            this.scriptCache += fs.readFileSync(__dirname + '/EurecaClient.js');

            response.writeHead(200);
            response.write(this.scriptCache);
            response.end();
        };

        Server.prototype.updateContract = function () {
            this.contract = Eureca.Contract.ensureContract(this.exports, this.contract);
            for (var id in this.clients) {
                var socket = this.clients[id];

                var sendObj = {};
                sendObj[Eureca.Protocol.contractId] = this.contract;
                socket.send(JSON.stringify(sendObj));
            }
        };

        Server.prototype._handleServer = function (ioServer) {
            var _this = this;

            //ioServer.on('connection', function (socket) {
            ioServer.onconnect(function (socket) {
                socket.eureca = {};
                socket.siggg = 'A';

                socket.eureca.remoteAddress = socket.remoteAddress;

                _this.clients[socket.id] = socket;

                //Send EURECA contract
                _this.contract = Eureca.Contract.ensureContract(_this.exports, _this.contract);

                var sendObj = {};
                sendObj[Eureca.Protocol.contractId] = _this.contract;
                socket.send(JSON.stringify(sendObj));

                _this.trigger('onConnect', socket);

                socket.onmessage(function (message) {
                    _this.trigger('onMessage', message, socket);

                    var jobj;
                    try  {
                        jobj = JSON.parse(message);
                    } catch (ex) {
                    }
                    ;

                    if (jobj === undefined)
                        return;
                    if (jobj[Eureca.Protocol.functionId] !== undefined) {
                        var returnFunc = function (result) {
                            var retObj = {};
                            retObj[Eureca.Protocol.signatureId] = this.retId;
                            retObj[Eureca.Protocol.resultId] = result;
                            this.connection.send(JSON.stringify(retObj));
                        };

                        var context = { user: { clientId: socket.id }, connection: socket, async: false, retId: jobj[Eureca.Protocol.signatureId], 'return': returnFunc };

                        if (!_this.settings.preInvoke || jobj[Eureca.Protocol.functionId] == 'authenticate' || (typeof _this.settings.preInvoke == 'function' && _this.settings.preInvoke.apply(context)))
                            _this.stub.invoke(context, _this, jobj, socket);

                        return;
                    }

                    if (jobj[Eureca.Protocol.signatureId] !== undefined) {
                        _this.stub.doCallBack(jobj[Eureca.Protocol.signatureId], jobj[Eureca.Protocol.resultId]);
                        return;
                    }
                });

                socket.onerror(function (e) {
                    _this.trigger('onError', e, socket);
                });

                socket.onclose(function () {
                    _this.trigger('onDisconnect', socket);
                    delete _this.clients[socket.id];
                    //console.log('i', '#of clients changed ', EURECA.clients.length, );
                });
            });
        };
        Server.prototype._checkHarmonyProxies = function () {
            if (typeof Proxy == 'undefined' && !hproxywarn) {
                ELog.log('I', 'Harmony proxy not found', 'using workaround');
                ELog.log('I', 'to avoid this message please use : node --harmony-proxies <app>', '');
                hproxywarn = true;
            }
        };

        //listen(port)
        //{
        //    this._checkHarmonyProxies();
        //    this.allowedF = this.settings.allow || [];
        //    var _prefix = this.settings.prefix || 'eureca.io';
        //    //initialising server
        //    //var ioServer = io.listen(port, { path: '/' + _prefix });
        //    var ioServer = this.transport.createServer(port, { path: '/' + _prefix });
        //    var _this = this;
        //    this._handleServer(ioServer);
        //}
        //installSockJs(server, options) {
        //    var sockjs = require('sockjs');
        //    var sockjs_server = sockjs.createServer();
        //    sockjs_server.installHandlers(server, options);
        //}
        Server.prototype.attach = function (server) {
            var app = server;
            if (server._events.request !== undefined && server.routes === undefined)
                app = server._events.request;

            this._checkHarmonyProxies();

            this.allowedF = this.settings.allow || [];
            var _prefix = this.settings.prefix || 'eureca.io';
            var _clientUrl = this.settings.clientScript || '/eureca.js';
            var _transformer = this.settings.transformer;
            var _parser = this.settings.parser;

            //initialising server
            //var ioServer = io.attach(server, { path: '/'+_prefix });
            var ioServer = this.transport.createServer(server, { prefix: _prefix, transformer: _transformer, parser: _parser });

            //console.log('Primus ? ', ioServer.primus);
            //var scriptLib = (typeof ioServer.primus == 'function') ? ioServer.primus.library() : null;
            var _this = this;

            this._handleServer(ioServer);

            //install on express
            //sockjs_server.installHandlers(server, {prefix:_prefix});
            if (app.get) {
                app.get(_clientUrl, function (request, response) {
                    _this.sendScript(request, response, _prefix);
                });
            } else {
                app.on('request', function (request, response) {
                    if (request.method === 'GET') {
                        if (request.url.split('?')[0] === _clientUrl) {
                            _this.sendScript(request, response, _prefix);
                        }
                    }
                });
            }

            //Workaround : nodejs 0.10.0 have a strange behaviour making remoteAddress unavailable when connecting from a nodejs client
            server.on('request', function (req, res) {
                if (!req.query)
                    return;

                var id = req.query.sid;
                var client = _this.clients[req.query.sid];

                if (client) {
                    client.eureca = client.eureca || {};
                    client.eureca.remoteAddress = client.eureca.remoteAddress || req.socket.remoteAddress;
                    client.eureca.remotePort = client.eureca.remotePort || req.socket.remotePort;
                }
                //req.eureca = {
                //    remoteAddress: req.socket.remoteAddress,
                //    remotePort: req.socket.remotePort
                //}
            });
        };
        return Server;
    })(Eureca.EObject);
    Eureca.Server = Server;
})(Eureca || (Eureca = {}));
exports.Eureca = Eureca;

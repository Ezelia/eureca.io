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
/// <reference path="transport/Primus.transport.ts" />
/// <reference path="Stub.ts" />
/// <reference path="EObject.class.ts" />
/// <reference path="Util.class.ts" />

var is_nodejs = Eureca.Util.isNodejs;
if (is_nodejs) {
    var _eureca_prefix = 'eureca.io';
}

//var EurecaSocket = function (uri, options) {
//    if (is_nodejs) {
//        var sock = require('engine.io-client')(uri, options);
//        return sock;
//    } else {
//        return new eio.Socket(uri, options);
//    }
//};
var Eureca;
(function (Eureca) {
    // Class
    var Client = (function (_super) {
        __extends(Client, _super);
        // Constructor
        function Client(settings) {
            if (typeof settings === "undefined") { settings = {}; }
            _super.call(this);
            this.settings = settings;
            this.tries = 0;

            this.stub = new Eureca.Stub(settings);

            settings.transformer = settings.transport || 'engine.io';
            settings.transport = 'primus';
            console.log('* using primus:' + settings.transformer);
            this.transport = Eureca.Transport.get(settings.transport);

            var _this = this;
            this.exports = {};

            this.settings.autoConnect = !(this.settings.autoConnect === false);

            //if (this.settings.autoConnect !== false)
            this.maxRetries = settings.retry || 20;

            //var tries = 0;
            this.registerEvents(['ready', 'update', 'onConnect', 'onDisconnect', 'onError', 'onMessage', 'onConnectionLost', 'onConnectionRetry']);

            if (this.settings.autoConnect)
                this.connect();
        }
        Client.prototype.disconnect = function () {
            this.tries = this.maxRetries + 1;
            this.socket.close();
        };
        Client.prototype.connect = function () {
            var _this = this;
            var prefix = '';
            prefix += this.settings.prefix || _eureca_prefix;

            var _eureca_uri = _eureca_uri || undefined;
            var uri = this.settings.uri || (prefix ? _eureca_host + '/' + prefix : (_eureca_uri || undefined));

            console.log(uri, prefix);
            _this._ready = false;
            var _transformer = this.settings.transformer;
            var _parser = this.settings.parser;

            //_this.socket = EurecaSocket(uri, { path: prefix });
            var client = this.transport.createClient(uri, { prefix: prefix, transformer: _transformer, parser: _parser, retries: this.maxRetries, minDelay: 100 });
            _this.socket = client;

            client.onopen(function () {
                _this.trigger('onConnect', client);
                _this.tries = 0;
            });

            client.onmessage(function (data) {
                _this.trigger('onMessage', data);

                try  {
                    var jobj = JSON.parse(data);
                } catch (ex) {
                    var jobj = {};
                }

                if (jobj[Eureca.Protocol.contractId]) {
                    var update = _this.contract && _this.contract.length > 0;

                    _this.contract = jobj[Eureca.Protocol.contractId];
                    _this.stub.importRemoteFunction(_this, _this.socket, jobj[Eureca.Protocol.contractId]);

                    var next = function () {
                        _this._ready = true;
                        if (update)
                            _this.trigger('update', _this, _this.contract);
                        else
                            _this.trigger('ready', _this, _this.contract);
                    };

                    if (_this.settings.authenticate)
                        _this.settings.authenticate(_this, next);
                    else
                        next();

                    return;
                }

                // /!\ ordre is important we have to check invoke BEFORE callback
                if (jobj[Eureca.Protocol.functionId] !== undefined) {
                    var returnFunc = function (result) {
                        var retObj = {};
                        retObj[Eureca.Protocol.signatureId] = this.retId;
                        retObj[Eureca.Protocol.resultId] = result;
                        this.connection.send(JSON.stringify(retObj));
                    };

                    var context = { user: { clientId: _this.socket.id }, connection: _this.socket, async: false, retId: jobj[Eureca.Protocol.signatureId], 'return': returnFunc };

                    _this.stub.invoke(context, _this, jobj, _this.socket);
                    return;
                }

                if (jobj[Eureca.Protocol.signatureId] !== undefined) {
                    _this.stub.doCallBack(jobj[Eureca.Protocol.signatureId], jobj[Eureca.Protocol.resultId]);
                    return;
                }
            });

            client.ondisconnect(function (opts) {
                _this.trigger('onConnectionRetry', opts);
                /*
                
                _this.tries++;
                if (_this.tries > _this.maxRetries) //handle 1002 and 1006 sockjs error codes
                {
                _this.trigger('onConnectionLost');
                
                return;
                }
                //var utime = Math.pow(2, tries);
                var utime = _this.tries;
                setTimeout(function () {
                _this.connect();
                }, utime * 1000);
                */
            });

            client.onclose(function (e) {
                _this.trigger('onDisconnect', client, e);
                _this.trigger('onConnectionLost');
            });

            client.onerror(function (e) {
                _this.trigger('onError', e);
            });
        };
        return Client;
    })(Eureca.EObject);
    Eureca.Client = Client;
})(Eureca || (Eureca = {}));

if (is_nodejs)
    exports.Eureca = Eureca;
else
    var EURECA = Eureca.Client;

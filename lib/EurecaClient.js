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
var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var is_nodejs = Eureca.Util.isNodejs;
if(is_nodejs) {
    var _eureca_prefix = 'eureca.io';
}
var EurecaSocket = function (uri, options) {
    if(is_nodejs) {
        var sock = require('engine.io-client')(uri, options);
        return sock;
    } else {
        return new eio.Socket(uri, options);
    }
};
var Eureca;
(function (Eureca) {
    var Client = (function (_super) {
        __extends(Client, _super);
        function Client(settings) {
            if (typeof settings === "undefined") { settings = {
            }; }
                _super.call(this);
            this.settings = settings;
            this.tries = 0;
            this.stub = new Eureca.Stub(settings);
            settings.transport = settings.transport || 'engine.io';
            console.log('* using ' + settings.transport);
            this.transport = Eureca.Transport.get(settings.transport);
            var _this = this;
            this.exports = {
            };
            this.settings.autoConnect = !(this.settings.autoConnect === false);
            this.maxRetries = settings.retry || 20;
            this.registerEvents([
                'ready', 
                'onConnect', 
                'onDisconnect', 
                'onError', 
                'onMessage', 
                'onConnectionLost', 
                'onConnectionRetry'
            ]);
            if(this.settings.autoConnect) {
                this.connect();
            }
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
            var client = this.transport.createClient(uri, {
                prefix: prefix
            });
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
                    var jobj = {
                    };
                }
                if(jobj.__eureca__) {
                    _this.contract = jobj.__eureca__;
                    _this.stub.importRemoteFunction(_this, _this.socket, jobj.__eureca__);
                    var next = function () {
                        _this._ready = true;
                        _this.trigger('ready', _this);
                    };
                    if(_this.settings.authenticate) {
                        _this.settings.authenticate(_this, next);
                    } else {
                        next();
                    }
                    return;
                }
                if(jobj.f !== undefined) {
                    _this.stub.invoke(_this.exports, _this, jobj, _this.socket);
                    return;
                }
                if(jobj._r !== undefined) {
                    _this.stub.doCallBack(jobj._r, jobj.r);
                    return;
                }
            });
            client.ondisconnect(function (e) {
                _this.trigger('onConnectionRetry');
                _this.tries++;
                if(_this.tries > _this.maxRetries) {
                    _this.trigger('onConnectionLost');
                    return;
                }
                var utime = _this.tries;
                setTimeout(function () {
                    _this.connect();
                }, utime * 1000);
            });
            client.onclose(function (e) {
                _this.trigger('onDisconnect', client, e);
            });
            client.onerror(function (e) {
                _this.trigger('onError', e);
            });
        };
        return Client;
    })(Eureca.EObject);
    Eureca.Client = Client;    
})(Eureca || (Eureca = {}));
if(is_nodejs) {
    exports.Eureca = Eureca;
} else {
    var EURECA = Eureca.Client;
}

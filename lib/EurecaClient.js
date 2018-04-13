var Eureca;
(function (Eureca) {
    class EObject {
        constructor() {
        }
        extend(options) {
            if (options) {
                for (var key in options)
                    this[key] = options[key];
            }
        }
        bind(event, fct) {
            this._events = this._events || {};
            this._events[event] = this._events[event] || [];
            this._events[event].push(fct);
        }
        on(event, fct) {
            this._events = this._events || {};
            this._events[event] = this._events[event] || [];
            this._events[event].push(fct);
        }
        unbind(event, fct) {
            this._events = this._events || {};
            if (event in this._events === false)
                return;
            this._events[event].splice(this._events[event].indexOf(fct), 1);
        }
        unbindEvent(event) {
            this._events = this._events || {};
            this._events[event] = [];
        }
        unbindAll() {
            this._events = this._events || {};
            for (var event in this._events)
                this._events[event] = false;
        }
        trigger(event, ...args) {
            this._events = this._events || {};
            if (event in this._events === false)
                return;
            for (var i = 0; i < this._events[event].length; i++) {
                this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
            }
        }
        registerEvent(evtname) {
            this[evtname] = function (callback, replace) {
                if (typeof callback == 'function') {
                    if (replace)
                        this.unbindEvent(evtname);
                    this.bind(evtname, callback);
                }
                return this;
            };
        }
        registerEvents(eventsArray) {
            for (var i = 0; i < eventsArray.length; i++)
                this.registerEvent(eventsArray[i]);
        }
    }
    Eureca.EObject = EObject;
})(Eureca || (Eureca = {}));
var Eureca;
(function (Eureca) {
    class Util {
        static randomStr(length = 10) {
            let text = '';
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for (let i = 0; i < length; i++) {
                text += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return text;
        }
    }
    Util.isNodejs = (typeof exports == 'object' && exports);
    Eureca.Util = Util;
})(Eureca || (Eureca = {}));
var Eureca;
(function (Eureca) {
    class Transport {
        static register(name, clientScript, createClient, createServer, defaultSerializer, defaultDeserializer) {
            if (this.transports[name] !== undefined)
                return false;
            this.transports[name] = {
                createClient: createClient,
                createServer: createServer,
                script: clientScript,
                serialize: defaultSerializer,
                deserialize: defaultDeserializer
            };
        }
        static get(name) {
            if (name != 'webrtc') {
                return this.transports['primus'];
            }
            else {
                return this.transports[name];
            }
        }
    }
    Transport.transports = {};
    Eureca.Transport = Transport;
})(Eureca || (Eureca = {}));
var Eureca;
(function (Eureca) {
    var Transports;
    (function (Transports) {
        var PrimusTransport;
        (function (PrimusTransport) {
            if (Eureca.Util.isNodejs) {
                Primus = require('primus');
            }
            class Socket extends Eureca.EObject {
                constructor(socket) {
                    super();
                    this.socket = socket;
                    this.eureca = {};
                    this.request = socket.request;
                    this.id = socket.id;
                    this.remoteAddress = socket.address;
                    this.bindEvents();
                }
                bindEvents() {
                    var __this = this;
                    this.socket.on('open', function () {
                        var args = arguments.length > 0 ? Array.prototype.slice.call(arguments, 0) : [];
                        args.unshift('open');
                        __this.trigger.apply(__this, args);
                    });
                    this.socket.on('data', function () {
                        var args = arguments.length > 0 ? Array.prototype.slice.call(arguments, 0) : [];
                        args.unshift('message');
                        __this.trigger.apply(__this, args);
                    });
                    this.socket.on('end', function () {
                        var args = arguments.length > 0 ? Array.prototype.slice.call(arguments, 0) : [];
                        args.unshift('close');
                        __this.trigger.apply(__this, args);
                    });
                    this.socket.on('error', function () {
                        var args = arguments.length > 0 ? Array.prototype.slice.call(arguments, 0) : [];
                        args.unshift('error');
                        __this.trigger.apply(__this, args);
                    });
                    this.socket.on('reconnecting', function () {
                        var args = arguments.length > 0 ? Array.prototype.slice.call(arguments, 0) : [];
                        args.unshift('reconnecting');
                        __this.trigger.apply(__this, args);
                    });
                }
                isAuthenticated() {
                    return this.eureca.authenticated;
                }
                send(data) {
                    if (this.socket.send) {
                        this.socket.send(data);
                    }
                    else {
                        this.socket.write(data);
                    }
                }
                close() {
                    if (this.socket.end) {
                        this.socket.end();
                    }
                    else {
                        this.socket.close();
                    }
                }
                onopen(callback) {
                    this.socket.on('open', callback);
                }
                onmessage(callback) {
                    this.socket.on('data', callback);
                }
                onclose(callback) {
                    this.socket.on('end', callback);
                }
                onerror(callback) {
                    this.socket.on('error', callback);
                }
                ondisconnect(callback) {
                    this.socket.on('reconnecting', callback);
                }
            }
            PrimusTransport.Socket = Socket;
            class Server {
                constructor(primus) {
                    this.primus = primus;
                }
                onconnect(callback) {
                    this.primus.on('connection', function (psocket) {
                        var socket = new Socket(psocket);
                        callback(socket);
                    });
                }
            }
            PrimusTransport.Server = Server;
            var createServer = function (hook, options = {}) {
                try {
                    options.pathname = options.prefix ? '/' + options.prefix : undefined;
                    var primus = new Primus(hook, options);
                    var primusTransport = Eureca.Transport.get('primus');
                    primusTransport.script = primus.library();
                    var server = new Server(primus);
                    return server;
                }
                catch (ex) {
                    if (ex.name == 'PrimusError' && ex.message.indexOf('Missing dependencies') == 0) {
                        console.error('Missing ', options.transformer);
                        process.exit();
                    }
                    else {
                        throw ex;
                    }
                }
            };
            var createClient = function (uri, options = {}) {
                options.pathname = options.prefix ? '/' + options.prefix : undefined;
                options.path = options.prefix ? '/' + options.prefix : undefined;
                var socket;
                if (Eureca.Util.isNodejs) {
                    var CSocket = Primus.createSocket(options);
                    socket = new CSocket(uri);
                }
                else {
                    console.log('>>> Ezelia : createClient', uri, options);
                    socket = new Primus(uri, options);
                }
                var client = new Socket(socket);
                return client;
            };
            Eureca.Transport.register('primus', '', createClient, createServer, (v) => v, (v) => v);
        })(PrimusTransport = Transports.PrimusTransport || (Transports.PrimusTransport = {}));
    })(Transports = Eureca.Transports || (Eureca.Transports = {}));
})(Eureca || (Eureca = {}));
var Eureca;
(function (Eureca) {
    var Transports;
    (function (Transports) {
        var WebRTC;
        (function (WebRTC) {
            var webrtc;
            if (Eureca.Util.isNodejs) {
                try {
                    webrtc = require('wrtc');
                }
                catch (e) {
                    webrtc = { unavailable: true, error: e };
                }
            }
            var PeerConnection = Eureca.Util.isNodejs ? webrtc.RTCPeerConnection : window['RTCPeerConnection'] || window['mozRTCPeerConnection'] || window['webkitRTCPeerConnection'];
            var SessionDescription = Eureca.Util.isNodejs ? webrtc.RTCSessionDescription : window['RTCSessionDescription'] || window['mozRTCSessionDescription'] || window['webkitRTCSessionDescription'];
            class Peer extends Eureca.EObject {
                constructor(settings = { reliable: true }) {
                    super();
                    this.id = Eureca.Util.randomStr(16);
                    this.pc = null;
                    this.offer = null;
                    this.channel = null;
                    this.pendingDataChannels = {};
                    this.dataChannels = {};
                    this.cfg = {
                        "iceServers": [
                            { "urls": "stun:stun.l.google.com:19302" },
                            { "urls": 'stun:stun1.l.google.com:19302' }
                        ]
                    };
                    this.channelSettings = {
                        reliable: true,
                        ordered: true,
                        maxRetransmits: null
                    };
                    this.lastState = '';
                    if (webrtc && webrtc.unavailable) {
                        console.error("wrtc module not found\n");
                        console.error(" * Please follow instructions here https://github.com/js-platform/node-webrtc to install wrtc\n");
                        console.error(" * Note : WebRTC is only supported on x64 platforms\n");
                        process.exit();
                    }
                    if (typeof settings.reliable != 'undefined')
                        this.channelSettings.reliable = settings.reliable;
                    if (typeof settings.maxRetransmits != 'undefined')
                        this.channelSettings.maxRetransmits = settings.maxRetransmits;
                    if (typeof settings.ordered !== 'undefined')
                        this.channelSettings.ordered = settings.ordered;
                }
                makeOffer(callback, failureCallback) {
                    var __this = this;
                    var pc = new PeerConnection(this.cfg, this.con);
                    this.pc = pc;
                    pc.onsignalingstatechange = this.onsignalingstatechange.bind(this);
                    pc.oniceconnectionstatechange = this.oniceconnectionstatechange.bind({ pc: pc, handler: this });
                    pc.onicegatheringstatechange = this.onicegatheringstatechange.bind(this);
                    pc.onicecandidate = function (candidate) {
                        if (candidate.candidate == null) {
                            if (typeof callback == 'function')
                                callback(pc);
                        }
                    };
                    var channel = pc.createDataChannel('eureca.io', { reliable: __this.channelSettings.reliable, maxRetransmits: __this.channelSettings.maxRetransmits, ordered: __this.channelSettings.ordered });
                    this.channel = channel;
                    pc.createOffer()
                        .then(desc => pc.setLocalDescription(desc), failureCallback)
                        .then(() => { }, failureCallback);
                }
                getAnswer(pastedAnswer) {
                    var data = typeof pastedAnswer == 'string' ? JSON.parse(pastedAnswer) : pastedAnswer;
                    var answer = new SessionDescription(data);
                    this.pc.setRemoteDescription(answer);
                }
                getOffer(pastedOffer, request, callback) {
                    var __this = this;
                    var data = typeof pastedOffer === 'object' ? pastedOffer : JSON.parse(pastedOffer);
                    var pc = new PeerConnection(this.cfg, this.con);
                    pc.onsignalingstatechange = this.onsignalingstatechange.bind(this);
                    pc.oniceconnectionstatechange = this.oniceconnectionstatechange.bind({ pc: pc, handler: this });
                    pc.onicegatheringstatechange = this.onicegatheringstatechange.bind(this);
                    pc.onicecandidate = function (candidate) {
                        if (candidate.candidate == null) {
                            if (typeof callback == 'function')
                                callback(pc);
                        }
                    };
                    pc.ondatachannel = function (evt) {
                        var channel = evt.channel;
                        channel.request = request;
                        var label = channel.label;
                        __this.pendingDataChannels[label] = channel;
                        channel.binaryType = 'arraybuffer';
                        channel.onopen = function () {
                            __this.dataChannels[label] = channel;
                            delete __this.pendingDataChannels[label];
                            __this.trigger('datachannel', channel);
                        };
                    };
                    const offer = new SessionDescription(data);
                    pc.setRemoteDescription(offer)
                        .then(() => pc.createAnswer(), __this.doHandleError)
                        .then(desc => pc.setLocalDescription(desc), __this.doHandleError)
                        .then(() => { }, __this.doHandleError);
                }
                onsignalingstatechange(state) {
                }
                oniceconnectionstatechange(state) {
                    var __this = this.handler;
                    var pc = this.pc;
                    __this.trigger('stateChange', pc.iceConnectionState);
                    __this.lastState = pc.iceConnectionState;
                    if (__this.stateTimeout != undefined)
                        clearTimeout(__this.stateTimeout);
                    if (pc.iceConnectionState == 'disconnected' || pc.iceConnectionState == 'failed') {
                        __this.trigger('disconnected');
                    }
                    if (pc.iceConnectionState == 'completed' || pc.iceConnectionState == 'connected') {
                    }
                    else {
                        __this.stateTimeout = setTimeout(function () {
                            __this.trigger('timeout');
                        }, 5000);
                    }
                }
                onicegatheringstatechange(state) {
                }
                doHandleError(error) {
                    this.trigger('error', error);
                }
            }
            WebRTC.Peer = Peer;
        })(WebRTC = Transports.WebRTC || (Transports.WebRTC = {}));
    })(Transports = Eureca.Transports || (Eureca.Transports = {}));
})(Eureca || (Eureca = {}));
var Eureca;
(function (Eureca) {
    var Transports;
    (function (Transports) {
        var WebRTCTransport;
        (function (WebRTCTransport) {
            var qs, http;
            if (Eureca.Util.isNodejs) {
                qs = require('querystring');
                http = require('http');
                try {
                    webrtc = require('wrtc');
                }
                catch (e) {
                    webrtc = {};
                }
            }
            class Socket extends Eureca.EObject {
                constructor(socket, peer) {
                    super();
                    this.socket = socket;
                    this.peer = peer;
                    this.eureca = {};
                    this.id = peer && peer.id ? peer.id : Eureca.Util.randomStr(16);
                    if (socket && socket.request)
                        this.request = socket.request;
                    this.bindEvents();
                }
                update(socket) {
                    if (this.socket != null) {
                        this.socket.onopen = null;
                        this.socket.onmessage = null;
                        this.socket.onclose = null;
                        this.socket.onerror = null;
                    }
                    this.socket = socket;
                    this.bindEvents();
                }
                bindEvents() {
                    if (this.socket == null)
                        return;
                    var __this = this;
                    this.socket.onopen = function () {
                        __this.trigger('open');
                    };
                    this.socket.onmessage = function (event) {
                        __this.trigger('message', event.data);
                    };
                    this.socket.onclose = function () {
                        __this.trigger('close');
                    };
                    this.socket.onerror = function (error) {
                        __this.trigger('error', error);
                    };
                    if (this.peer) {
                        this.peer.on('stateChange', function (s) {
                            __this.trigger('stateChange', s);
                        });
                    }
                }
                isAuthenticated() {
                    return this.eureca.authenticated;
                }
                send(data) {
                    if (this.socket == null)
                        return;
                    this.socket.send(data);
                }
                close() {
                    this.socket.close();
                }
                onopen(callback) {
                    this.on('open', callback);
                }
                onmessage(callback) {
                    this.on('message', callback);
                }
                onclose(callback) {
                    this.on('close', callback);
                }
                onerror(callback) {
                    this.on('error', callback);
                }
                ondisconnect(callback) {
                }
            }
            WebRTCTransport.Socket = Socket;
            class Server {
                constructor(appServer, options) {
                    this.appServer = appServer;
                    this.serverPeer = new Transports.WebRTC.Peer();
                    var __this = this;
                    var app = appServer;
                    if (appServer._events.request !== undefined && appServer.routes === undefined)
                        app = appServer._events.request;
                    if (app.get && app.post) {
                        app.post('/webrtc-' + options.prefix, function (request, response) {
                            if (request.body) {
                                var offer = request.body[Eureca.Protocol.signal];
                                __this.serverPeer.getOffer(offer, request, function (pc) {
                                    var resp = {};
                                    resp[Eureca.Protocol.signal] = pc.localDescription;
                                    response.write(JSON.stringify(resp));
                                    response.end();
                                });
                                return;
                            }
                            __this.processPost(request, response, function () {
                                var offer = request.post[Eureca.Protocol.signal];
                                response.writeHead(200, "OK", { 'Content-Type': 'text/plain' });
                                __this.serverPeer.getOffer(offer, request, function (pc) {
                                    var resp = {};
                                    resp[Eureca.Protocol.signal] = pc.localDescription;
                                    response.write(JSON.stringify(resp));
                                    response.end();
                                });
                            });
                        });
                    }
                    else {
                        appServer.on('request', function (request, response) {
                            if (request.method === 'POST') {
                                if (request.url.split('?')[0] === '/webrtc-' + options.prefix) {
                                    __this.processPost(request, response, function () {
                                        var offer = request.post[Eureca.Protocol.signal];
                                        response.writeHead(200, "OK", { 'Content-Type': 'text/plain' });
                                        __this.serverPeer.getOffer(offer, request, function (pc) {
                                            var resp = {};
                                            resp[Eureca.Protocol.signal] = pc.localDescription;
                                            response.write(JSON.stringify(resp));
                                            response.end();
                                        });
                                    });
                                }
                            }
                        });
                    }
                    __this.serverPeer.on('stateChange', function (s) {
                        __this.appServer.eurecaServer.trigger('stateChange', s);
                    });
                }
                processPost(request, response, callback) {
                    var queryData = "";
                    if (typeof callback !== 'function')
                        return null;
                    if (request.method == 'POST') {
                        request.on('data', function (data) {
                            queryData += data;
                            if (queryData.length > 1e6) {
                                queryData = "";
                                response.writeHead(413, { 'Content-Type': 'text/plain' }).end();
                                request.connection.destroy();
                            }
                        });
                        request.on('end', function () {
                            request.post = qs.parse(queryData);
                            callback();
                        });
                    }
                    else {
                        response.writeHead(405, { 'Content-Type': 'text/plain' });
                        response.end();
                    }
                }
                onconnect(callback) {
                    this.serverPeer.on('datachannel', function (datachannel) {
                        var socket = new Socket(datachannel);
                        callback(socket);
                    });
                }
            }
            WebRTCTransport.Server = Server;
            var createServer = function (hook, options) {
                try {
                    var server = new Server(hook, options);
                    return server;
                }
                catch (ex) {
                }
            };
            var createClient = function (uri, options = {}) {
                options.pathname = options.prefix ? '/' + options.prefix : undefined;
                options.path = options.prefix ? '/' + options.prefix : undefined;
                var clientPeer;
                clientPeer = new Transports.WebRTC.Peer(options);
                clientPeer.on('disconnected', function () {
                    clientPeer.channel.close();
                    signal();
                });
                var client = new Socket(clientPeer.channel, clientPeer);
                var retries = options.retries;
                var signal = function () {
                    if (retries <= 0) {
                        client.trigger('close');
                        return;
                    }
                    retries--;
                    clientPeer.makeOffer(function (pc) {
                        if (Eureca.Util.isNodejs) {
                            var url = require("url");
                            var postDataObj = {};
                            postDataObj[Eureca.Protocol.signal] = JSON.stringify(pc.localDescription);
                            var post_data = qs.stringify(postDataObj);
                            var parsedURI = url.parse(uri);
                            var post_options = {
                                host: parsedURI.hostname,
                                port: parsedURI.port,
                                path: '/webrtc-' + options.prefix,
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    'Content-Length': post_data.length
                                }
                            };
                            var post_req = http.request(post_options, function (res) {
                                res.setEncoding('utf8');
                                res.on('data', function (chunk) {
                                    var resp = JSON.parse(chunk);
                                    clientPeer.getAnswer(resp[Eureca.Protocol.signal]);
                                    retries = options.retries;
                                });
                            });
                            post_req.write(post_data);
                            post_req.end();
                            post_req.on('error', function (error) {
                                setTimeout(function () { signal(); }, 3000);
                            });
                        }
                        else {
                            var xhr = new XMLHttpRequest();
                            var params = Eureca.Protocol.signal + '=' + JSON.stringify(pc.localDescription);
                            var parser = document.createElement('a');
                            parser.href = uri;
                            xhr.open("POST", '//' + parser.hostname + ':' + parser.port + '/webrtc-' + options.prefix, true);
                            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                            xhr.onreadystatechange = function () {
                                if (xhr.readyState == 4 && xhr.status == 200) {
                                    var resp = JSON.parse(xhr.responseText);
                                    clientPeer.getAnswer(resp[Eureca.Protocol.signal]);
                                    retries = options.retries;
                                }
                                else {
                                    if (xhr.readyState == 4 && xhr.status != 200) {
                                        setTimeout(function () { signal(); }, 3000);
                                    }
                                }
                            };
                            xhr.send(params);
                        }
                        client.update(clientPeer.channel);
                    }, function (error) {
                        client.trigger('error', error);
                    });
                };
                signal();
                clientPeer.on('timeout', () => {
                    signal();
                });
                return client;
            };
            const deserialize = (message) => {
                var jobj;
                if (typeof message != 'object') {
                    try {
                        jobj = JSON.parse(message);
                    }
                    catch (ex) { }
                    ;
                }
                else {
                    jobj = message;
                }
                return jobj;
            };
            Eureca.Transport.register('webrtc', '', createClient, createServer, JSON.stringify, deserialize);
        })(WebRTCTransport = Transports.WebRTCTransport || (Transports.WebRTCTransport = {}));
    })(Transports = Eureca.Transports || (Eureca.Transports = {}));
})(Eureca || (Eureca = {}));
var Eureca;
(function (Eureca) {
    class Protocol {
    }
    Protocol.contractId = '__eureca__';
    Protocol.authReq = '__auth__';
    Protocol.authResp = '__authr__';
    Protocol.signal = '__signal__';
    Protocol.signalACK = '__sigack__';
    Protocol.functionId = 'f';
    Protocol.argsId = 'a';
    Protocol.resultId = 'r';
    Protocol.errorId = 'e';
    Protocol.signatureId = 's';
    Protocol.context = 'c';
    Eureca.Protocol = Protocol;
})(Eureca || (Eureca = {}));
var Eureca;
(function (Eureca) {
    class EurecaPromise extends Promise {
        constructor(executor) {
            super(executor);
            this.sig = null;
            this.resolve = null;
            this.reject = null;
        }
        onReady(onfullfilled, onrejected) {
            console.warn('onReady() is deprecated, please use then() instead');
            return this.then(onfullfilled, onrejected);
        }
    }
    Eureca.EurecaPromise = EurecaPromise;
})(Eureca || (Eureca = {}));
var Eureca;
(function (Eureca) {
    class Stub {
        constructor(settings = {}) {
            this.settings = settings;
            this.serialize = settings.serialize;
            this.deserialize = settings.deserialize;
        }
        static registerCallBack(sig, cb) {
            this.callbacks[sig] = cb;
        }
        static doCallBack(sig, result, error) {
            if (!sig)
                return;
            var proxyObj = this.callbacks[sig];
            delete this.callbacks[sig];
            if (proxyObj !== undefined) {
                proxyObj.status = 1;
                if (error == null)
                    proxyObj.resolve(result);
                else
                    proxyObj.reject(error);
            }
        }
        invokeRemoteOld(context, fname, socket, ...args) {
            var proxyObj = {
                status: 0,
                result: null,
                error: null,
                sig: null,
                callback: function () { },
                errorCallback: function () { },
                then: function (fn, errorFn) {
                    if (this.status != 0) {
                        if (this.error == null)
                            fn(this.result);
                        else
                            errorFn(this.error);
                        return;
                    }
                    if (typeof fn == 'function') {
                        this.callback = fn;
                    }
                    if (typeof errorFn == 'function') {
                        this.errorCallback = errorFn;
                    }
                }
            };
            proxyObj['onReady'] = proxyObj.then;
            var RMIObj = {};
            var argsArray = args;
            var uid = Eureca.Util.randomStr();
            proxyObj.sig = uid;
            Stub.registerCallBack(uid, proxyObj);
            RMIObj[Eureca.Protocol.functionId] = fname;
            RMIObj[Eureca.Protocol.signatureId] = uid;
            if (argsArray.length > 0)
                RMIObj[Eureca.Protocol.argsId] = argsArray;
            socket.send(this.settings.serialize.call(context, RMIObj));
            return proxyObj;
        }
        invokeRemote(context, fname, socket, ...args) {
            let resolveCB;
            let rejectCB;
            var proxyObj = new Eureca.EurecaPromise((resolve, reject) => {
                resolveCB = resolve;
                rejectCB = reject;
            });
            proxyObj.resolve = resolveCB;
            proxyObj.reject = rejectCB;
            var RMIObj = {};
            var argsArray = args;
            var uid = Eureca.Util.randomStr();
            proxyObj.sig = uid;
            Stub.registerCallBack(uid, proxyObj);
            RMIObj[Eureca.Protocol.functionId] = fname;
            RMIObj[Eureca.Protocol.signatureId] = uid;
            if (argsArray.length > 0)
                RMIObj[Eureca.Protocol.argsId] = argsArray;
            socket.send(this.settings.serialize.call(context, RMIObj));
            return proxyObj;
        }
        importRemoteFunction(handle, socket, functions) {
            var _this = this;
            if (functions === undefined)
                return;
            for (var i = 0; i < functions.length; i++) {
                (function (idx, fname) {
                    var proxy = handle;
                    var ftokens = fname.split('.');
                    for (var i = 0; i < ftokens.length - 1; i++) {
                        proxy[ftokens[i]] = proxy[ftokens[i]] || {};
                        proxy = proxy[ftokens[i]];
                    }
                    var _fname = ftokens[ftokens.length - 1];
                    proxy[_fname] = function (...args) {
                        args.unshift(socket);
                        args.unshift(fname);
                        args.unshift(proxy[_fname]);
                        return _this.invokeRemote.apply(_this, args);
                    };
                })(i, functions[i]);
            }
        }
        sendResult(socket, sig, result, error) {
            if (!socket)
                return;
            var retObj = {};
            retObj[Eureca.Protocol.signatureId] = sig;
            retObj[Eureca.Protocol.resultId] = result;
            retObj[Eureca.Protocol.errorId] = error;
            socket.send(this.serialize(retObj));
        }
        invoke(context, handle, obj, socket) {
            var fId = parseInt(obj[Eureca.Protocol.functionId]);
            var fname = isNaN(fId) ? obj[Eureca.Protocol.functionId] : handle.contract[fId];
            var ftokens = fname.split('.');
            var func = handle.exports;
            for (var i = 0; i < ftokens.length; i++) {
                if (!func) {
                    console.log('Invoke error', obj[Eureca.Protocol.functionId] + ' is not a function', '');
                    this.sendResult(socket, obj[Eureca.Protocol.signatureId], null, 'Invoke error : ' + obj[Eureca.Protocol.functionId] + ' is not a function');
                    return;
                }
                func = func[ftokens[i]];
            }
            if (typeof func != 'function') {
                console.log('Invoke error', obj[Eureca.Protocol.functionId] + ' is not a function', '');
                this.sendResult(socket, obj[Eureca.Protocol.signatureId], null, 'Invoke error : ' + obj[Eureca.Protocol.functionId] + ' is not a function');
                return;
            }
            try {
                obj[Eureca.Protocol.argsId] = obj[Eureca.Protocol.argsId] || [];
                var result = func.apply(context, obj[Eureca.Protocol.argsId]);
                if (socket && obj[Eureca.Protocol.signatureId] && !context.async) {
                    this.sendResult(socket, obj[Eureca.Protocol.signatureId], result, null);
                }
                obj[Eureca.Protocol.argsId].unshift(socket);
                if (typeof func.onCall == 'function')
                    func.onCall.apply(context, obj[Eureca.Protocol.argsId]);
            }
            catch (ex) {
                console.log('EURECA Invoke exception!! ', ex.stack);
            }
        }
    }
    Stub.callbacks = {};
    Eureca.Stub = Stub;
})(Eureca || (Eureca = {}));
var Eureca;
(function (Eureca) {
    class Contract {
        constructor() { }
        static parseNS(target, ns = [], parent = '') {
            for (var prop in target) {
                if (typeof target[prop] == 'function') {
                    ns.push(parent + prop);
                }
                else {
                    Contract.parseNS(target[prop], ns, parent + prop + '.');
                }
            }
            return ns;
        }
        static ensureContract(target, contract) {
            var contract = this.parseNS(target);
            return contract;
        }
    }
    Eureca.Contract = Contract;
})(Eureca || (Eureca = {}));
if (typeof exports != 'undefined')
    exports.Eureca = Eureca;
var is_nodejs = Eureca.Util.isNodejs;
if (is_nodejs) {
    var _eureca_prefix = 'eureca.io';
}
var Eureca;
(function (Eureca) {
    class Client extends Eureca.EObject {
        constructor(settings = {}) {
            super();
            this.settings = settings;
            this.tries = 0;
            this.serialize = (v) => v;
            this.deserialize = (v) => v;
            this.serverProxy = {};
            settings.transformer = settings.transport || 'engine.io';
            this.transport = Eureca.Transport.get(settings.transformer);
            if (typeof settings.serialize == 'function' || typeof this.transport.serialize == 'function')
                this.serialize = settings.serialize || this.transport.serialize;
            settings.serialize = this.serialize;
            if (typeof settings.deserialize == 'function' || typeof this.transport.deserialize == 'function')
                this.deserialize = settings.deserialize || this.transport.deserialize;
            settings.deserialize = this.deserialize;
            this.stub = new Eureca.Stub(settings);
            this.exports = {};
            this.settings.autoConnect = !(this.settings.autoConnect === false);
            this.maxRetries = settings.retry || 20;
            if (this.settings.autoConnect)
                this.connect();
        }
        disconnect() {
            this.tries = this.maxRetries + 1;
            this.socket.close();
        }
        isReady() {
            return this._ready;
        }
        send(rawData) {
            return this.socket.send(this.serialize(rawData));
        }
        authenticate(...args) {
            var authRequest = {};
            authRequest[Eureca.Protocol.authReq] = args;
            this.socket.send(this.serialize(authRequest));
        }
        isAuthenticated() {
            return this.socket.isAuthenticated();
        }
        setupWebRTC() {
        }
        connect() {
            var prefix = '';
            prefix += this.settings.prefix || _eureca_prefix;
            var _eureca_uri = _eureca_uri || undefined;
            var uri = this.settings.uri || (prefix ? _eureca_host + '/' + prefix : (_eureca_uri || undefined));
            console.log(uri, prefix);
            this._ready = false;
            var _transformer = this.settings.transformer;
            var _parser = this.settings.parser;
            var client = this.transport.createClient(uri, {
                prefix: prefix,
                transformer: _transformer,
                parser: _parser,
                retries: this.maxRetries,
                minDelay: 100,
                reliable: this.settings.reliable,
                maxRetransmits: this.settings.maxRetransmits,
                ordered: this.settings.ordered
            });
            this.socket = client;
            client._proxy = this.serverProxy;
            this._handleClient(client, this.serverProxy);
        }
        _handleClient(client, proxy) {
            const __this = this;
            client.on('open', function () {
                __this.trigger('connect', client);
                __this.tries = 0;
            });
            client.on('message', function (data) {
                __this.trigger('message', data);
                var jobj = __this.deserialize.call(client, data);
                if (typeof jobj != 'object') {
                    __this.trigger('unhandledMessage', data);
                    return;
                }
                if (jobj[Eureca.Protocol.contractId]) {
                    var update = __this.contract && __this.contract.length > 0;
                    __this.contract = jobj[Eureca.Protocol.contractId];
                    __this.stub.importRemoteFunction(proxy, client, jobj[Eureca.Protocol.contractId]);
                    __this._ready = true;
                    if (update) {
                        __this.trigger('update', proxy, __this.contract);
                    }
                    else {
                        __this.trigger('ready', proxy, __this.contract);
                    }
                    return;
                }
                if (jobj[Eureca.Protocol.authResp] !== undefined) {
                    client.eureca.authenticated = true;
                    var callArgs = ['authResponse'].concat(jobj[Eureca.Protocol.authResp]);
                    __this.trigger.apply(__this, callArgs);
                    return;
                }
                if (jobj[Eureca.Protocol.functionId] !== undefined) {
                    if (client.context == undefined) {
                        var returnFunc = function (result, error = null) {
                            var retObj = {};
                            retObj[Eureca.Protocol.signatureId] = this.retId;
                            retObj[Eureca.Protocol.resultId] = result;
                            retObj[Eureca.Protocol.errorId] = error;
                            this.connection.send(this.serialize(retObj));
                        };
                        client.context = {
                            user: { clientId: client.id },
                            connection: client,
                            socket: client,
                            serverProxy: client.serverProxy,
                            async: false,
                            retId: jobj[Eureca.Protocol.signatureId],
                            serialize: __this.serialize,
                            'return': returnFunc
                        };
                    }
                    client.context.retId = jobj[Eureca.Protocol.signatureId];
                    __this.stub.invoke(client.context, __this, jobj, client);
                    return;
                }
                if (jobj[Eureca.Protocol.signatureId] !== undefined) {
                    Eureca.Stub.doCallBack(jobj[Eureca.Protocol.signatureId], jobj[Eureca.Protocol.resultId], jobj[Eureca.Protocol.errorId]);
                    return;
                }
                __this.trigger('unhandledMessage', data);
            });
            client.on('reconnecting', function (opts) {
                __this.trigger('connectionRetry', opts);
            });
            client.on('close', function (e) {
                __this.trigger('disconnect', client, e);
                __this.trigger('connectionLost');
            });
            client.on('error', function (e) {
                __this.trigger('error', e);
            });
            client.on('stateChange', function (s) {
                __this.trigger('stateChange', s);
            });
        }
        ready(callback) {
            this.on('ready', callback);
        }
        update(callback) {
            this.on('update', callback);
        }
        onConnect(callback) {
            this.on('connect', callback);
        }
        onDisconnect(callback) {
            this.on('disconnect', callback);
        }
        onMessage(callback) {
            this.on('message', callback);
        }
        onUnhandledMessage(callback) {
            this.on('unhandledMessage', callback);
        }
        onError(callback) {
            this.on('error', callback);
        }
        onConnectionLost(callback) {
            this.on('connectionLost', callback);
        }
        onConnectionRetry(callback) {
            this.on('connectionRetry', callback);
        }
        onAuthResponse(callback) {
            this.on('authResponse', callback);
        }
    }
    Eureca.Client = Client;
})(Eureca || (Eureca = {}));
if (is_nodejs)
    exports.Eureca = Eureca;
else
    var EURECA = Eureca.Client;

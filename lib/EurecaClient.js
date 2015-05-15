/** @ignore */
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
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
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
/** @ignore */
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
            if (length === void 0) { length = 10; }
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
/** @ignore */
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
            if (name != 'webrtc') {
                console.log('* using primus:' + name);
                //settings.transport =  'primus';
                return this.transports['primus'];
            }
            else {
                console.log('* using ' + name);
                return this.transports[name];
            }
        };
        Transport.transports = {};
        return Transport;
    })();
    Eureca.Transport = Transport;
})(Eureca || (Eureca = {}));
/// <reference path="../EObject.class.ts" />
/// <reference path="../Util.class.ts" />
/// <reference path="../Transport.ts" />
/// <reference path="../IServer.interface.ts" />
/// <reference path="../ISocket.interface.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/** @ignore */
var Eureca;
(function (Eureca) {
    var Transports;
    (function (Transports) {
        var PrimusTransport;
        (function (PrimusTransport) {
            if (Eureca.Util.isNodejs) {
                Primus = require('primus');
            }
            var Socket = (function (_super) {
                __extends(Socket, _super);
                //public webRTCChannel:any;
                //private wRTCPeer;
                function Socket(socket) {
                    _super.call(this);
                    this.socket = socket;
                    this.eureca = {};
                    this.request = socket.request;
                    this.id = socket.id;
                    //FIXME : with nodejs 0.10.0 remoteAddress of nodejs clients is undefined (this seems to be a engine.io issue)            
                    this.remoteAddress = socket.address;
                    //this.registerEvents(['open', 'message', 'error', 'close', 'reconnecting']);
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
                //public setupWebRTC()
                //{
                //    if (this.wRTCPeer) return;
                //    var _this = this;
                //    this.wRTCPeer = new Eureca.Transports.WebRTC.Peer();
                //    this.wRTCPeer.makeOffer(function(pc) {
                //        var webRTCSignalReq = {};
                //        webRTCSignalReq[Eureca.Protocol.signal] = pc.localDescription;
                //        _this.send(webRTCSignalReq);
                //    });
                //}
                Socket.prototype.isAuthenticated = function () {
                    return this.eureca.authenticated;
                };
                Socket.prototype.send = function (data /*, webRTC=false*/) {
                    //if (webRTC && this.webRTCChannel)
                    //{
                    //    this.webRTCChannel.send(data);
                    //    return;
                    //}
                    if (this.socket.send) {
                        this.socket.send(data);
                    }
                    else {
                        this.socket.write(data);
                    }
                };
                Socket.prototype.close = function () {
                    if (this.socket.end) {
                        this.socket.end();
                    }
                    else {
                        this.socket.close();
                    }
                };
                //deprecated ?
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
                //on client connect
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
                if (options === void 0) { options = {}; }
                try {
                    //var primusOptions: any = {};
                    options.pathname = options.prefix ? '/' + options.prefix : undefined;
                    var primus = new Primus(hook, options);
                    primus.save(__dirname + '/js/primus.js');
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
            var createClient = function (uri, options) {
                if (options === void 0) { options = {}; }
                options.pathname = options.prefix ? '/' + options.prefix : undefined;
                options.path = options.prefix ? '/' + options.prefix : undefined;
                var socket;
                if (Eureca.Util.isNodejs) {
                    //eioptions.transports = ['websocket', 'polling', 'flashsocket'];
                    //console.log('connecting to ', uri, options);
                    var CSocket = Primus.createSocket(options);
                    socket = new CSocket(uri);
                }
                else {
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
        })(PrimusTransport = Transports.PrimusTransport || (Transports.PrimusTransport = {}));
    })(Transports = Eureca.Transports || (Eureca.Transports = {}));
})(Eureca || (Eureca = {}));
/// <reference path="../EObject.class.ts" />
/// <reference path="../Util.class.ts" />
/// 
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
                    //console.error("wrtc module not found : WebRTC support will not be available");
                    //process.exit(e.code);
                    webrtc = { unavailable: true, error: e };
                }
            }
            var PeerConnection = Eureca.Util.isNodejs ? webrtc.RTCPeerConnection : window['RTCPeerConnection'] || window['mozRTCPeerConnection'] || window['webkitRTCPeerConnection'];
            var SessionDescription = Eureca.Util.isNodejs ? webrtc.RTCSessionDescription : window['RTCSessionDescription'] || window['mozRTCSessionDescription'] || window['webkitRTCSessionDescription'];
            var Peer = (function (_super) {
                __extends(Peer, _super);
                function Peer(settings) {
                    if (settings === void 0) { settings = { reliable: true }; }
                    _super.call(this);
                    this.id = Eureca.Util.randomStr(16);
                    this.pc = null;
                    this.offer = null;
                    //private answer = null;
                    this.channel = null;
                    this.pendingDataChannels = {};
                    this.dataChannels = {};
                    //public dataChannelSettings = {
                    //    'reliable': {
                    //        ordered: true,
                    //        maxRetransmits: 0
                    //    },
                    //};
                    //public pcSettings = [
                    //  {
                    //    "iceServers": [{"url":"stun:stun.l.google.com:19302"}]
                    //  },
                    //  {
                    //    "optional": [{"DtlsSrtpKeyAgreement": false}]
                    //  }
                    //];
                    this.cfg = {
                        "iceServers": [
                            { "url": "stun:stun.l.google.com:19302" },
                            { url: 'stun:stun1.l.google.com:19302' }
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
                        console.error(" * If you are running Linux or MacOS X please follow instructions here https://github.com/js-platform/node-webrtc to install wrtc\n");
                        console.error(" * Windows server side WebRTC is not supported yet\n");
                        process.exit();
                    }
                    if (typeof settings.reliable != 'undefined')
                        this.channelSettings.reliable = settings.reliable;
                    if (typeof settings.maxRetransmits != 'undefined')
                        this.channelSettings.maxRetransmits = settings.maxRetransmits;
                    if (typeof settings.ordered !== 'undefined')
                        this.channelSettings.ordered = settings.ordered;
                    //console.log('WebRTC settings = ', settings, this.channelSettings);
                }
                Peer.prototype.makeOffer = function (callback) {
                    var _this = this;
                    var pc = new PeerConnection(this.cfg, this.con);
                    this.pc = pc;
                    this.makeDataChannel();
                    pc.onsignalingstatechange = this.onsignalingstatechange.bind(this);
                    pc.oniceconnectionstatechange = this.oniceconnectionstatechange.bind(this);
                    pc.onicegatheringstatechange = this.onicegatheringstatechange.bind(this);
                    pc.createOffer(function (desc) {
                        pc.setLocalDescription(desc, function () {
                        });
                        // We'll pick up the offer text once trickle ICE is complete,
                        // in onicecandidate.
                    });
                    pc.onicecandidate = function (candidate) {
                        // Firing this callback with a null candidate indicates that
                        // trickle ICE gathering has finished, and all the candidates
                        // are now present in pc.localDescription.  Waiting until now
                        // to create the answer saves us from having to send offer +
                        // answer + iceCandidates separately.
                        if (candidate.candidate == null) {
                            if (typeof callback == 'function')
                                callback(pc);
                        }
                    };
                };
                Peer.prototype.makeDataChannel = function () {
                    var _this = this;
                    // If you don't make a datachannel *before* making your offer (such
                    // that it's included in the offer), then when you try to make one
                    // afterwards it just stays in "connecting" state forever.  This is
                    // my least favorite thing about the datachannel API.
                    var channel = this.pc.createDataChannel(this.id, { id: _this.id, reliable: _this.channelSettings.reliable, maxRetransmits: _this.channelSettings.maxRetransmits, ordered: _this.channelSettings.ordered });
                    this.channel = channel;
                    channel.onopen = function () {
                        _this.trigger('open', channel);
                    };
                    channel.onmessage = function (evt) {
                        var data = JSON.parse(evt.data);
                        _this.trigger('message', data.message);
                    };
                    channel.onerror = function (error) {
                        _this.doHandleError(error);
                    };
                    ;
                };
                Peer.prototype.getAnswer = function (pastedAnswer) {
                    var data = typeof pastedAnswer == 'string' ? JSON.parse(pastedAnswer) : pastedAnswer;
                    var answer = new SessionDescription(data);
                    this.pc.setRemoteDescription(answer);
                };
                Peer.prototype.getOffer = function (pastedOffer, callback) {
                    var data = JSON.parse(pastedOffer);
                    this.offer = new SessionDescription(data);
                    var pc = new PeerConnection(this.cfg, this.con);
                    this.pc = pc;
                    pc.onsignalingstatechange = this.onsignalingstatechange.bind(this);
                    pc.oniceconnectionstatechange = this.oniceconnectionstatechange.bind(this);
                    pc.onicegatheringstatechange = this.onicegatheringstatechange.bind(this);
                    pc.onicecandidate = function (candidate) {
                        // Firing this callback with a null candidate indicates that
                        // trickle ICE gathering has finished, and all the candidates
                        // are now present in pc.localDescription.  Waiting until now
                        // to create the answer saves us from having to send offer +
                        // answer + iceCandidates separately.
                        if (candidate.candidate == null) {
                            if (typeof callback == 'function')
                                callback(pc.localDescription);
                        }
                    };
                    this.doHandleDataChannels();
                };
                Peer.prototype.onsignalingstatechange = function (state) {
                    //console.info('signaling state change:', state);
                };
                Peer.prototype.oniceconnectionstatechange = function (state) {
                    var _this = this;
                    if (this.pc) {
                        console.info('ice connection state change:', this.pc.iceConnectionState);
                        this.lastState = this.pc.iceConnectionState;
                        if (this.stateTimeout != undefined)
                            clearTimeout(this.stateTimeout);
                        if (this.pc.iceConnectionState == 'disconnected' || this.pc.iceConnectionState == 'failed') {
                            this.trigger('disconnected');
                        }
                        if (this.pc.iceConnectionState == 'completed' || this.pc.iceConnectionState == 'connected') {
                            var ackObj = {};
                            ackObj[Eureca.Protocol.signalACK] = 1;
                            var maxtries = 10;
                            var itv = setInterval(function () {
                                maxtries--;
                                if (maxtries <= 0) {
                                    clearInterval(itv);
                                    _this.doHandleError('Channel readyState failure ');
                                    return;
                                }
                                if (_this.channel.readyState == 'open') {
                                    clearInterval(itv);
                                    _this.channel.send(JSON.stringify(ackObj));
                                }
                            }, 500);
                        }
                        else {
                            this.stateTimeout = setTimeout(function () {
                                console.log('State timeout');
                                _this.trigger('timeout');
                            }, 5000);
                        }
                    }
                    //if (this.pc.
                };
                Peer.prototype.onicegatheringstatechange = function (state) {
                    //console.info('ice gathering state change:', state);
                };
                Peer.prototype.doCreateAnswer = function () {
                    var _this = this;
                    this.pc.createAnswer(function (desc) {
                        _this.doSetLocalDesc(desc);
                    }, function (error) {
                        _this.doHandleError(error);
                    });
                };
                Peer.prototype.doSetLocalDesc = function (desc) {
                    var _this = this;
                    //this.answer = desc;
                    this.pc.setLocalDescription(desc, undefined, function (error) {
                        _this.doHandleError(error);
                    });
                };
                Peer.prototype.doHandleError = function (error) {
                    this.trigger('error', error);
                };
                Peer.prototype.doHandleDataChannels = function () {
                    var _this = this;
                    //var labels = Object.keys(this.dataChannelSettings);
                    this.pc.ondatachannel = function (evt) {
                        var channel = evt.channel;
                        _this.channel = channel;
                        var label = channel.label;
                        _this.pendingDataChannels[label] = channel;
                        //channel.binaryType = 'arraybuffer';
                        channel.onopen = function () {
                            _this.dataChannels[label] = channel;
                            delete _this.pendingDataChannels[label];
                        };
                        channel.onmessage = function (evt) {
                            var data = JSON.parse(evt.data);
                            if (data[Eureca.Protocol.signalACK] == 1) {
                                _this.trigger('open', channel);
                            }
                            _this.trigger('message', data.message);
                        };
                        channel.onerror = function (error) {
                            _this.doHandleError(error);
                        };
                    };
                    this.pc.setRemoteDescription(this.offer, function () {
                        _this.doCreateAnswer();
                    }, function (error) {
                        _this.doHandleError(error);
                    });
                };
                return Peer;
            })(Eureca.EObject);
            WebRTC.Peer = Peer;
        })(WebRTC = Transports.WebRTC || (Transports.WebRTC = {}));
    })(Transports = Eureca.Transports || (Eureca.Transports = {}));
})(Eureca || (Eureca = {}));
/// <reference path="../EObject.class.ts" />
/// <reference path="../Util.class.ts" />
/// <reference path="../Transport.ts" />
/// <reference path="../IServer.interface.ts" />
/// <reference path="../ISocket.interface.ts" />
/// <reference path="WebRTCPeer.ts" />
/** @ignore */
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
                    //console.error("WebRTC not be available, you need to install wrtc module");
                    //process.exit(e.code);
                    webrtc = {};
                }
            }
            var Socket = (function (_super) {
                __extends(Socket, _super);
                function Socket(socket, peer) {
                    _super.call(this);
                    this.socket = socket;
                    this.peer = peer;
                    this.eureca = {};
                    //this.request = socket.request;
                    this.id = peer && peer.id ? peer.id : Eureca.Util.randomStr(16);
                    //FIXME : with nodejs 0.10.0 remoteAddress of nodejs clients is undefined (this seems to be a engine.io issue)            
                    //this.remoteAddress = socket.address;
                    //this.registerEvents(['open', 'message', 'error', 'close', 'reconnecting']);
                    this.bindEvents();
                }
                Socket.prototype.update = function (socket) {
                    if (this.socket != null) {
                        this.socket.onopen = null;
                        this.socket.onmessage = null;
                        this.socket.onclose = null;
                        this.socket.onerror = null;
                    }
                    this.socket = socket;
                    this.bindEvents();
                };
                Socket.prototype.bindEvents = function () {
                    if (this.socket == null)
                        return;
                    var _this = this;
                    this.socket.onopen = function () {
                        _this.trigger('open');
                    };
                    this.socket.onmessage = function (event) {
                        _this.trigger('message', event.data);
                    };
                    this.socket.onclose = function () {
                        _this.trigger('close');
                    };
                    this.socket.onerror = function (error) {
                        _this.trigger('error', error);
                    };
                    //if (this.peer) {
                    //    this.peer.unbindEvent('disconnected');
                    //    this.peer.on('disconnected', function () {
                    //        _this.trigger('close');
                    //    });
                    //}
                    /*
                    this.socket.on('reconnecting', function () {
                        var args = arguments.length > 0 ? Array.prototype.slice.call(arguments, 0) : [];
                        args.unshift('reconnecting');
                        _this.trigger.apply(_this, args);
                    });
                    */
                };
                Socket.prototype.isAuthenticated = function () {
                    return this.eureca.authenticated;
                };
                Socket.prototype.send = function (data) {
                    //console.log('sending ', data);
                    if (this.socket == null)
                        return;
                    this.socket.send(data);
                };
                Socket.prototype.close = function () {
                    this.socket.close();
                };
                //deprecated ?
                Socket.prototype.onopen = function (callback) {
                    this.on('open', callback);
                };
                Socket.prototype.onmessage = function (callback) {
                    this.on('message', callback);
                };
                Socket.prototype.onclose = function (callback) {
                    this.on('close', callback);
                };
                Socket.prototype.onerror = function (callback) {
                    this.on('error', callback);
                };
                Socket.prototype.ondisconnect = function (callback) {
                    //this.socket.on('reconnecting', callback);
                };
                return Socket;
            })(Eureca.EObject);
            WebRTCTransport.Socket = Socket;
            var Server = (function () {
                function Server(server, options) {
                    this.server = server;
                    this.serverPeer = new Transports.WebRTC.Peer();
                    var _this = this;
                    var app = server;
                    if (server._events.request !== undefined && server.routes === undefined)
                        app = server._events.request;
                    if (app.get && app.post) {
                        app.post('/webrtc-' + options.prefix, function (request, response) {
                            _this.processPost(request, response, function () {
                                //console.log('Got post data', request.post);
                                var offer = request.post[Eureca.Protocol.signal];
                                response.writeHead(200, "OK", { 'Content-Type': 'text/plain' });
                                _this.serverPeer.getOffer(offer, function (desc) {
                                    var resp = {};
                                    resp[Eureca.Protocol.signal] = desc;
                                    response.write(JSON.stringify(resp));
                                    response.end();
                                });
                            });
                        });
                    }
                    else {
                        //we use POST request for webRTC signaling            
                        server.on('request', function (request, response) {
                            if (request.method === 'POST') {
                                if (request.url.split('?')[0] === '/webrtc-' + options.prefix) {
                                    _this.processPost(request, response, function () {
                                        //console.log('Got post data', request.post);
                                        var offer = request.post[Eureca.Protocol.signal];
                                        response.writeHead(200, "OK", { 'Content-Type': 'text/plain' });
                                        _this.serverPeer.getOffer(offer, function (desc) {
                                            var resp = {};
                                            resp[Eureca.Protocol.signal] = desc;
                                            response.write(JSON.stringify(resp));
                                            response.end();
                                        });
                                    });
                                }
                            }
                        });
                    }
                }
                Server.prototype.processPost = function (request, response, callback) {
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
                };
                Server.prototype.onconnect = function (callback) {
                    this.serverPeer.on('open', function (datachannel) {
                        var socket = new Socket(datachannel);
                        //Eureca.Util.extend(iosocket, socket);
                        callback(socket);
                    });
                };
                return Server;
            })();
            WebRTCTransport.Server = Server;
            /**
             *
             *
             * @param hook - eureca server
             */
            var createServer = function (hook, options) {
                try {
                    var server = new Server(hook, options);
                    return server;
                }
                catch (ex) {
                }
            };
            var createClient = function (uri, options) {
                if (options === void 0) { options = {}; }
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
                                    //console.log('Response: ' + resp['__signal__']);
                                    clientPeer.getAnswer(resp[Eureca.Protocol.signal]);
                                    retries = options.retries;
                                });
                            });
                            post_req.write(post_data);
                            post_req.end();
                            post_req.on('error', function (error) {
                                //console.log('E = ', error);
                                setTimeout(function () {
                                    signal();
                                }, 3000);
                            });
                        }
                        else {
                            var xhr = new XMLHttpRequest();
                            var params = Eureca.Protocol.signal + '=' + JSON.stringify(pc.localDescription);
                            var parser = document.createElement('a');
                            parser.href = uri;
                            //parser.protocol;
                            //parser.host;    
                            //parser.hostname;
                            //parser.port;    
                            //parser.pathname;
                            //parser.hash;    
                            //parser.search;  
                            //var params = "lorem=ipsum&name=binny";
                            xhr.open("POST", '//' + parser.hostname + ':' + parser.port + '/webrtc-' + options.prefix, true);
                            //Send the proper header information along with the request
                            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                            //xhr.setRequestHeader("Content-length", params.length.toString());
                            //xhr.setRequestHeader("Connection", "close");
                            xhr.onreadystatechange = function () {
                                //console.log('XHR = ', xhr.readyState, xhr.status);
                                if (xhr.readyState == 4 && xhr.status == 200) {
                                    var resp = JSON.parse(xhr.responseText);
                                    clientPeer.getAnswer(resp[Eureca.Protocol.signal]);
                                    retries = options.retries;
                                    console.log('Got response ', resp);
                                }
                                else {
                                    if (xhr.readyState == 4 && xhr.status != 200) {
                                        setTimeout(function () {
                                            signal();
                                        }, 3000);
                                    }
                                }
                            };
                            xhr.send(params);
                        }
                        client.update(clientPeer.channel);
                    });
                };
                signal();
                //if connection timeout
                clientPeer.on('timeout', signal);
                return client;
            };
            Eureca.Transport.register('webrtc', '', createClient, createServer);
        })(WebRTCTransport = Transports.WebRTCTransport || (Transports.WebRTCTransport = {}));
    })(Transports = Eureca.Transports || (Eureca.Transports = {}));
})(Eureca || (Eureca = {}));
/** @ignore */
var Eureca;
(function (Eureca) {
    var Protocol = (function () {
        function Protocol() {
        }
        //internal stuff
        Protocol.contractId = '__eureca__';
        Protocol.authReq = '__auth__';
        Protocol.authResp = '__authr__';
        Protocol.signal = '__signal__';
        Protocol.signalACK = '__sigack__';
        //RPC stuff
        Protocol.functionId = 'f';
        Protocol.argsId = 'a';
        Protocol.resultId = 'r';
        Protocol.errorId = 'e';
        Protocol.signatureId = '_r';
        Protocol.context = 'c';
        return Protocol;
    })();
    Eureca.Protocol = Protocol;
})(Eureca || (Eureca = {}));
/// <reference path="Protocol.config.ts" />
/// <reference path="Util.class.ts" />
/** @ignore */
var Eureca;
(function (Eureca) {
    // Class
    var Stub = (function () {
        // Constructor
        function Stub(settings) {
            if (settings === void 0) { settings = {}; }
            this.settings = settings;
            this.callbacks = {};
        }
        Stub.prototype.registerCallBack = function (sig, cb) {
            this.callbacks[sig] = cb;
        };
        Stub.prototype.doCallBack = function (sig, result, error) {
            if (!sig)
                return;
            var proxyObj = this.callbacks[sig];
            delete this.callbacks[sig];
            if (proxyObj !== undefined) {
                proxyObj.status = 1;
                proxyObj.result = result;
                proxyObj.error = error;
                if (error == null)
                    proxyObj.callback(result);
                else
                    proxyObj.errorCallback(error);
            }
        };
        /**
         *
         */
        Stub.prototype.importRemoteFunction = function (handle, socket, functions, serialize) {
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
                        var proxyObj = {
                            status: 0,
                            result: null,
                            error: null,
                            sig: null,
                            callback: function () {
                            },
                            errorCallback: function () {
                            },
                            //TODO : use the standardized promise syntax instead of onReady
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
                        //onReady retro-compatibility
                        proxyObj['onReady'] = proxyObj.then;
                        var RMIObj = {};
                        var argsArray = Array.prototype.slice.call(arguments, 0);
                        var uid = Eureca.Util.randomStr();
                        proxyObj.sig = uid;
                        _this.registerCallBack(uid, proxyObj);
                        RMIObj[Eureca.Protocol.functionId] = _this.settings.useIndexes ? idx : fname;
                        RMIObj[Eureca.Protocol.signatureId] = uid;
                        if (argsArray.length > 0)
                            RMIObj[Eureca.Protocol.argsId] = argsArray;
                        //Experimental custom context sharing
                        //allow sharing global context (set in serverProxy/clientProxy) or local proxy set in the caller object
                        //if (proxy[_fname].context || handle.context) RMIObj[Protocol.context] = proxy[_fname].context || handle.context;
                        //socket.send(JSON.stringify(RMIObj));
                        socket.send(serialize.call(proxy[_fname], RMIObj));
                        return proxyObj;
                    };
                })(i, functions[i]);
            }
        };
        Stub.prototype.sendResult = function (socket, sig, result, error) {
            if (!socket)
                return;
            var retObj = {};
            retObj[Eureca.Protocol.signatureId] = sig;
            retObj[Eureca.Protocol.resultId] = result;
            retObj[Eureca.Protocol.errorId] = error;
            socket.send(JSON.stringify(retObj));
        };
        Stub.prototype.invoke = function (context, handle, obj, socket) {
            var fId = parseInt(obj[Eureca.Protocol.functionId]);
            var fname = isNaN(fId) ? obj[Eureca.Protocol.functionId] : handle.contract[fId];
            /* browing namespace */
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
            /* ***************** */
            //var func = this.exports[fname];
            if (typeof func != 'function') {
                //socket.send('Invoke error');
                console.log('Invoke error', obj[Eureca.Protocol.functionId] + ' is not a function', '');
                this.sendResult(socket, obj[Eureca.Protocol.signatureId], null, 'Invoke error : ' + obj[Eureca.Protocol.functionId] + ' is not a function');
                return;
            }
            try {
                obj[Eureca.Protocol.argsId] = obj[Eureca.Protocol.argsId] || [];
                var result = func.apply(context, obj[Eureca.Protocol.argsId]);
                //console.log('sending back result ', result, obj)
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
        };
        return Stub;
    })();
    Eureca.Stub = Stub;
})(Eureca || (Eureca = {}));
/** @ignore */
var Eureca;
(function (Eureca) {
    var Contract = (function () {
        // Constructor
        function Contract() {
        }
        //Removing need for Harmony proxies for simplification
        //static handlerMaker(obj, contract) {
        //    return {
        //        getOwnPropertyDescriptor: function (name) {
        //            var desc = Object.getOwnPropertyDescriptor(obj, name);
        //            // a trapping proxy's properties must always be configurable
        //            if (desc !== undefined) { desc.configurable = true; }
        //            return desc;
        //        },
        //        getPropertyDescriptor: function (name) {
        //            var desc = (<any>Object).getPropertyDescriptor(obj, name); // not in ES5
        //            // a trapping proxy's properties must always be configurable
        //            if (desc !== undefined) { desc.configurable = true; }
        //            return desc;
        //        },
        //        getOwnPropertyNames: function () {
        //            return Object.getOwnPropertyNames(obj);
        //        },
        //        getPropertyNames: function () {
        //            return (<any>Object).getPropertyNames(obj);                // not in ES5
        //        },
        //        defineProperty: function (name, desc) {
        //            Object.defineProperty(obj, name, desc);
        //        },
        //        delete: function (name) { return delete obj[name]; },
        //        fix: function () {
        //            if (Object.isFrozen(obj)) {
        //                var result = {};
        //                Object.getOwnPropertyNames(obj).forEach(function (name) {
        //                    result[name] = Object.getOwnPropertyDescriptor(obj, name);
        //                });
        //                return result;
        //            }
        //            // As long as obj is not frozen, the proxy won't allow itself to be fixed
        //            return undefined; // will cause a TypeError to be thrown
        //        },
        //        has: function (name) { return name in obj; },
        //        hasOwn: function (name) { return ({}).hasOwnProperty.call(obj, name); },
        //        get: function (receiver, name) { return obj[name]; },
        //        set: function (receiver, name, val) {
        //            console.log('    Contract +=', name);
        //            contract.push(name);
        //            obj[name] = val;
        //            return true;
        //        }, // bad behavior when set fails in non-strict mode
        //        enumerate: function () {
        //            var result = [];
        //            for (var name in obj) { result.push(name); };
        //            return result;
        //        },
        //        keys: function () { return Object.keys(obj); }
        //    };
        //}
        //Removing need for Harmony proxies for simplification
        //static proxify(target, contract): any {
        //    if (typeof Proxy == 'undefined') return target;
        //    //ELog.log('I', 'Harmony proxy', 'Enabled');
        //    return Proxy.create((<any>Contract).handlerMaker(target, contract));
        //}
        Contract.parseNS = function (target, ns, parent) {
            if (ns === void 0) { ns = []; }
            if (parent === void 0) { parent = ''; }
            for (var prop in target) {
                //console.log('parsing prop', parent+prop, typeof target[prop]);
                if (typeof target[prop] == 'function') {
                    ns.push(parent + prop);
                }
                else {
                    //FIXME : will crash if sub NS has no children : example : exports.id = 'hello'
                    Contract.parseNS(target[prop], ns, parent + prop + '.');
                }
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
if (typeof exports != 'undefined')
    exports.Eureca = Eureca;
/// <reference path="transport/Primus.transport.ts" />
/// <reference path="transport/WebRTC.transport.ts" />
/// <reference path="Stub.ts" />
/// <reference path="EObject.class.ts" />
/// <reference path="Util.class.ts" />
/// <reference path="Contract.class.ts" />
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
    /**
     * Eureca client class
     * This constructor takes an optional settings object
     * @constructor Client
     * @param {object} [settings] - have the following properties <br />
     * @property {URI} settings.uri - Eureca server WS uri, browser client can automatically guess the server URI if you are using a single Eureca server but Nodejs client need this parameter.
     * @property {string} [settings.prefix=eureca.io] - This determines the websocket path, it's unvisible to the user but if for some reason you want to rename this path use this parameter.
     * @property {int} [settings.retry=20] - Determines max retries to reconnect to the server if the connection is lost.
     * @property {boolean} [settings.autoConnect=true] - Estabilish connection automatically after instantiation.<br />if set to False you'll need to call client.connect() explicitly.
     *
     *
     * @example
     * //<h4>Example of a nodejs client</h4>
     * var Eureca = require('eureca.io');
     * var client = new Eureca.Client({ uri: 'ws://localhost:8000/', prefix: 'eureca.io', retry: 3 });
     * client.ready(function (serverProxy) {
     *    // ...
     * });
     *
     * @example
     * //<h4>Equivalent browser client</h4>
     * &lt;!doctype html&gt;
     * &lt;html&gt;
     *     &lt;head&gt;
     *         &lt;script src=&quot;/eureca.js&quot;&gt;&lt;/script&gt;
     *     &lt;/head&gt;
     *     &lt;body&gt;
     *         &lt;script&gt;
     *             var client = new Eureca.Client({prefix: 'eureca.io', retry: 3 });
     *             //uri is optional in browser client
     *             client.ready(function (serverProxy) {
     *                 // ...
     *             });
     *         &lt;/script&gt;
     *     &lt;/body&gt;
     * &lt;/html&gt;
     *
     * @see authenticate
     * @see connect
     * @see disconnect
     * @see send
     * @see isReady
     *
     *
     */
    var Client = (function (_super) {
        __extends(Client, _super);
        function Client(settings) {
            if (settings === void 0) { settings = {}; }
            _super.call(this);
            this.settings = settings;
            this.tries = 0;
            this.serialize = JSON.stringify;
            this.deserialize = function (message) {
                var jobj;
                if (typeof message != 'object') {
                    try {
                        jobj = JSON.parse(message);
                    }
                    catch (ex) {
                    }
                    ;
                }
                else {
                    jobj = message;
                }
                return jobj;
            };
            /**
             * When the connection is estabilished, the server proxy object allow calling exported server functions.
             * @var {object} Client#serverProxy
             *
             */
            this.serverProxy = {};
            if (typeof settings.serialize == 'function')
                this.serialize = settings.serialize;
            if (typeof settings.deserialize == 'function')
                this.deserialize = settings.deserialize;
            this.stub = new Eureca.Stub(settings);
            //needed by primus
            settings.transformer = settings.transport || 'engine.io';
            this.transport = Eureca.Transport.get(settings.transformer);
            var _this = this;
            this.exports = {};
            this.settings.autoConnect = !(this.settings.autoConnect === false);
            //if (this.settings.autoConnect !== false) 
            this.maxRetries = settings.retry || 20;
            //var tries = 0;
            //this.registerEvents(['ready', 'update', 'onConnect', 'onDisconnect', 'onError', 'onMessage', 'onConnectionLost', 'onConnectionRetry', 'authResponse']);
            if (this.settings.autoConnect)
                this.connect();
        }
        /**
         * close client connection
         *
         *
         * @function Client#disconnect
         *
         */
        Client.prototype.disconnect = function () {
            this.tries = this.maxRetries + 1;
            this.socket.close();
        };
        /**
        * indicate if the client is ready or not, it's better to use client.ready() event, but if for some reason
        * you need to check if the client is ready without using the event system you can use this.<br />
        *
         * @function Client#isReady
         * @return {boolean} - true if the client is ready
         *
         * @example
         * var client = new Eureca.Client({..});
         * //...
         * if (client.isReady()) {
         *      client.serverProxy.foo();
         * }
         */
        Client.prototype.isReady = function () {
            return this._ready;
        };
        /**
         * Send user data to the server
         *
         * @function Client#send
         * @param {any} rawData - data to send (must be serializable type)
         */
        Client.prototype.send = function (rawData) {
            return this.socket.send(rawData);
        };
        /**
         * Send authentication request to the server. <br />
         * this can take an arbitrary number of arguments depending on what you defined in the server side <br />
         * when the server receive an auth request it'll handle it and return null on auth success, or an error message if something goes wrong <br />
         * you need to listed to auth result throught authResponse event
         * ** Important ** : it's up to you to define the authenticationmethod in the server side
         * @function Client#authenticate
         *
         * @example
         * var client = new Eureca.Client({..});
         * //listen to auth response
         * client.authResponse(function(result) {
         *     if (result == null) {
         *         // ... Auth OK
         *     }
         *     else {
         *         // ... Auth failed
         *     }
         * });
         *
         * client.ready(function(){
         *
         *      //send auth request
         *      client.authenticate('your_auth_token');
         * });
         */
        Client.prototype.authenticate = function () {
            //if (!this._ready) 
            //{
            //    return;
            //}
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            var authRequest = {};
            authRequest[Eureca.Protocol.authReq] = args;
            console.log('sending auth request', authRequest);
            this.socket.send(authRequest);
        };
        /*
         * If the authentication is used, this will tell you if you are already authenticated or not.
         * @return {boolean} true mean that the client is authenticated
         */
        Client.prototype.isAuthenticated = function () {
            return this.socket.isAuthenticated();
        };
        Client.prototype.setupWebRTC = function () {
            //this.stub.importRemoteFunction(_this.webRTCProxy, _this.socket, jobj[Eureca.Protocol.contractId]);
        };
        /**
         * connect client
         *
         *
         * @function Client#connect
         *
         */
        Client.prototype.connect = function () {
            //var _this = this;
            var prefix = '';
            prefix += this.settings.prefix || _eureca_prefix;
            var _eureca_uri = _eureca_uri || undefined;
            var uri = this.settings.uri || (prefix ? _eureca_host + '/' + prefix : (_eureca_uri || undefined));
            console.log(uri, prefix);
            this._ready = false;
            var _transformer = this.settings.transformer;
            var _parser = this.settings.parser;
            //_this.socket = EurecaSocket(uri, { path: prefix });
            var client = this.transport.createClient(uri, {
                prefix: prefix,
                transformer: _transformer,
                parser: _parser,
                retries: this.maxRetries,
                minDelay: 100,
                //WebRTC stuff
                reliable: this.settings.reliable,
                maxRetransmits: this.settings.maxRetransmits,
                ordered: this.settings.ordered
            });
            this.socket = client;
            client._proxy = this.serverProxy;
            this._handleClient(client, this.serverProxy);
        };
        Client.prototype._handleClient = function (client, proxy) {
            var _this = this;
            client.on('open', function () {
                _this.trigger('connect', client);
                _this.tries = 0;
            });
            client.on('message', function (data) {
                _this.trigger('message', data);
                var jobj = _this.deserialize.call(client, data);
                //if (typeof data != 'object') {
                //    try {
                //        jobj = JSON.parse(data);
                //    }
                //    catch (ex) {
                //        jobj = {};
                //    }
                //}
                //else {
                //    jobj = data;
                //}
                if (typeof jobj != 'object') {
                    _this.trigger('unhandledMessage', data);
                    return;
                }
                if (jobj[Eureca.Protocol.contractId]) {
                    var update = _this.contract && _this.contract.length > 0;
                    _this.contract = jobj[Eureca.Protocol.contractId];
                    /** Experimental : dynamic client contract*/
                    //if (jobj[Protocol.signatureId]) {
                    //    var contract = [];
                    //    contract = Contract.ensureContract(_this.exports);    
                    //    var contractResp = {};                    
                    //    contractResp[Protocol.contractId] = contract;
                    //    contractResp[Protocol.signatureId] = jobj[Protocol.signatureId];
                    //    _this.send(contractResp);
                    //    _this.contract = contract;
                    //}
                    /*****************************************************/
                    _this.stub.importRemoteFunction(proxy, client, jobj[Eureca.Protocol.contractId], _this.serialize);
                    //var next = function () {
                    _this._ready = true;
                    if (update) {
                        /**
                        * ** Experimental ** Triggered when the server explicitly notify the client about remote functions change.<br />
                        * you'll need this for example, if the server define some functions dynamically and need to make them available to clients.
                        *
                        */
                        _this.trigger('update', proxy, _this.contract);
                    }
                    else {
                        _this.trigger('ready', proxy, _this.contract);
                    }
                    //}
                    //if (_this.settings.authenticate) _this.settings.authenticate(_this, next);
                    //else next();
                    return;
                }
                //Handle auth response
                if (jobj[Eureca.Protocol.authResp] !== undefined) {
                    client.eureca.authenticated = true;
                    var callArgs = ['authResponse'].concat(jobj[Eureca.Protocol.authResp]);
                    _this.trigger.apply(_this, callArgs);
                    return;
                }
                // /!\ ordre is important we have to check invoke BEFORE callback
                if (jobj[Eureca.Protocol.functionId] !== undefined) {
                    if (client.context == undefined) {
                        var returnFunc = function (result, error) {
                            if (error === void 0) { error = null; }
                            var retObj = {};
                            retObj[Eureca.Protocol.signatureId] = this.retId;
                            retObj[Eureca.Protocol.resultId] = result;
                            retObj[Eureca.Protocol.errorId] = error;
                            this.connection.send(JSON.stringify(retObj));
                        };
                        client.context = { user: { clientId: client.id }, connection: client, socket: client, serverProxy: client.serverProxy, async: false, retId: jobj[Eureca.Protocol.signatureId], 'return': returnFunc };
                    }
                    client.context.retId = jobj[Eureca.Protocol.signatureId];
                    //Experimental custom context sharing
                    //remote context is shared throught clientProxy or proxy function in the server side
                    //Example 
                    // a server exposing hello() function
                    // a client calling server hello() function
                    //
                    // in the client side you can issue : 
                    //    eurecaServer.hello.context = {somefield:'someData'}
                    //    //you can also use eurecaServer.context = {somefield:'someData'} in this case it'll be global to all exposed functions !
                    //    eurecaServer.hello();
                    //
                    // in the server side, you get the remote shared context throught
                    //    exports.hello = function() {
                    //          console.log(this.remoteContext); // <== you get the remote context here 
                    //          console.log('hello');
                    //    }
                    //if (jobj[Eureca.Protocol.context]) {
                    //    client.remoteContext = jobj[Eureca.Protocol.context];
                    //}
                    _this.stub.invoke(client.context, _this, jobj, client);
                    return;
                }
                if (jobj[Eureca.Protocol.signatureId] !== undefined) {
                    _this.stub.doCallBack(jobj[Eureca.Protocol.signatureId], jobj[Eureca.Protocol.resultId], jobj[Eureca.Protocol.errorId]);
                    return;
                }
                _this.trigger('unhandledMessage', data);
            });
            client.on('reconnecting', function (opts) {
                _this.trigger('connectionRetry', opts);
            });
            client.on('close', function (e) {
                _this.trigger('disconnect', client, e);
                _this.trigger('connectionLost');
            });
            client.on('error', function (e) {
                _this.trigger('error', e);
            });
        };
        //#region ==[ Events bindings ]===================
        /**
         * Bind a callback to 'ready' event @see {@link Client#event:ready|Client ready event}
         * >**Note :** you can also use Client.on('ready', callback) to bind ready event
         *
         * @function Client#ready
         *
         */
        Client.prototype.ready = function (callback) {
            /**
            * Triggered when the connection is estabilished and server remote functions available to the client.
            *
            * @event Client#ready
            * @property {Proxy} serverProxy - server proxy object.
            * @example
            * client.ready(function (serverProxy) {
            *    serverProxy.hello();
            * });
            *
            */
            this.on('ready', callback);
        };
        /**
         * Bind a callback to 'update' event @see {@link Client#event:update|Client update event}
         * >**Note :** you can also use Client.on('update', callback) to bind update event
         *
         * @function Client#update
         *
         */
        Client.prototype.update = function (callback) {
            this.on('update', callback);
        };
        /**
         * Bind a callback to 'connect' event
         * >**Note :** you can also use Client.on('connect', callback) to bind connect event
         *
         * @function Client#onConnect
         *
         */
        Client.prototype.onConnect = function (callback) {
            this.on('connect', callback);
        };
        /**
         * Bind a callback to 'disconnect' event @see {@link Client#event:disconnect|Client disconnect event}
         * >**Note :** you can also use Client.on('disconnect', callback) to bind disconnect event
         *
         * @function Client#donDisconnect
         *
         */
        Client.prototype.onDisconnect = function (callback) {
            /**
            * triggered when the connection is lost after all retries to reestabilish it.
            *
            * @event Client#disconnect
            */
            this.on('disconnect', callback);
        };
        /**
         * Bind a callback to 'message' event @see {@link Client#event:message|Client message event}
         * >**Note :** you can also use Client.on('message', callback) to bind message event
         *
         * @function Client#onMessage
         *
         */
        Client.prototype.onMessage = function (callback) {
            /**
            * Triggered when the client receive a message from the server.
            * This event can be used to intercept exchanged messages betweens client and server, if you need to access low level network messages
            *
            * @event Client#message
            *
            *
            */
            this.on('message', callback);
        };
        /**
         * Bind a callback to 'unhandledMessage' event @see {@link Client#event:unhandledMessage|Client unhandledMessage event}
         * >**Note :** you can also use Client.on('message', callback) to bind unhandledMessage event
         *
         * @function Client#onUnhandledMessage
         *
         */
        Client.prototype.onUnhandledMessage = function (callback) {
            /**
            * Triggered when the client receive a message from the server and is not able to handle it.
            * this mean that the message is not an internal eureca.io message.<br />
            * if for some reason you need to exchange send/receive raw or custom data, listen to this event which in countrary to {@link Client#event:message|message event} will only trigger for non-eureca messages.
            *
            * @event Client#unhandledMessage
            *
            *
            */
            this.on('unhandledMessage', callback);
        };
        /**
         * Bind a callback to 'error' event @see {@link Client#event:error|Client error event}
         * >**Note :** you can also use Client.on('error', callback) to bind error event
         *
         * @function Client#onError
         *
         */
        Client.prototype.onError = function (callback) {
            /**
            * triggered if an error occure.
            *
            * @event Client#error
            * @property {String} error - the error message
            */
            this.on('error', callback);
        };
        /**
         * Bind a callback to 'connectionLost' event
         * >**Note :** you can also use Client.on('connectionLost', callback) to bind connectionLost event
         *
         * @function Client#onConnectionLost
         *
         */
        Client.prototype.onConnectionLost = function (callback) {
            this.on('connectionLost', callback);
        };
        /**
         * Bind a callback to 'connectionRetry' event
         * >**Note :** you can also use Client.on('connectionRetry', callback) to bind connectionRetry event
         *
         * @function Client#onConnectionRetry
         *
         */
        Client.prototype.onConnectionRetry = function (callback) {
            /**
            * triggered when the connection is lost and the client try to reconnect.
            *
            * @event Client#connectionRetry
            */
            this.on('connectionRetry', callback);
        };
        /**
         * Bind a callback to 'authResponse' event @see {@link Client#event:authResponse|Client authResponse event}
         * >**Note :** you can also use Client.on('authResponse', callback) to bind authResponse event
         *
         * @function Client#onAuthResponse
         *
         */
        Client.prototype.onAuthResponse = function (callback) {
            /**
            * Triggered when the client receive authentication response from the server.
            * The server should return a null response on authentication success.
            *
            * @event Client#authResponse
            *
            *
            */
            this.on('authResponse', callback);
        };
        return Client;
    })(Eureca.EObject);
    Eureca.Client = Client;
})(Eureca || (Eureca = {}));
if (is_nodejs)
    exports.Eureca = Eureca;
else
    var EURECA = Eureca.Client;

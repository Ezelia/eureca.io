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
    /**
     * Eureca server constructor
     * This constructor takes an optional settings object
     * @constructor Server
     * @param {object} [settings] - have the following properties
     * @property {string} [settings.transport=engine.io] - can be "engine.io", "sockjs", "websockets", "faye" or "browserchannel" by default "engine.io" is used
     * @property {function} [settings.authenticate] - If this function is defined, the client will not be able to invoke server functions until it successfully call the client side authenticate method, which will invoke this function.
     *
     * @example
     * <h4> # default instantiation</h4>
     * var Eureca = require('eureca.io');
     * //use default transport
     * var server = new Eureca.Server();
     *
     *
     * @example
     * <h4> # custom transport instantiation </h4>
     * var Eureca = require('eureca.io');
     * //use websockets transport
     * var server = new Eureca.Server({transport:'websockets'});
     *
     * @example
     * <h4> # Authentication </h4>
     * var Eureca = require('eureca.io');
     *
     * var eurecaServer = new Eureca.Server({
     *     authenticate: function (authToken, next) {
     *         console.log('Called Auth with token=', authToken);
     *
     *         if (isValidToekn(authToken)) next();  // authentication success
     *         else next('Auth failed'); //authentication fail
     *     }
     * });
     *
     * @see attach
     * @see getClient
     *
     *
     */
    var Server = (function (_super) {
        __extends(Server, _super);
        function Server(settings) {
            if (settings === void 0) { settings = {}; }
            _super.call(this);
            this.settings = settings;
            this.version = '0.6.0-dev';
            this.scriptCache = '';
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
            if (typeof settings.serialize == 'function')
                this.serialize = settings.serialize;
            if (typeof settings.deserialize == 'function')
                this.deserialize = settings.deserialize;
            this.stub = new Eureca.Stub(settings);
            settings.transformer = settings.transport || 'engine.io';
            this.transport = Eureca.Transport.get(settings.transformer);
            this.contract = [];
            this.debuglevel = settings.debuglevel || 1;
            //Removing need for Harmony proxies for simplification
            //var _exports = {};            
            //this.exports = Contract.proxify(_exports, this.contract);
            this.exports = {};
            this.allowedF = [];
            this.clients = {};
            this.useAuthentication = (typeof this.settings.authenticate == 'function');
            if (this.useAuthentication)
                this.exports.authenticate = this.settings.authenticate;
            //this.registerEvents(['onConnect', 'onDisconnect', 'onMessage', 'onError']);
        }
        Server.prototype.onConnect = function (callback) {
            this.on('connect', callback);
        };
        Server.prototype.onDisconnect = function (callback) {
            this.on('disconnect', callback);
        };
        Server.prototype.onMessage = function (callback) {
            this.on('message', callback);
        };
        Server.prototype.onError = function (callback) {
            this.on('error', callback);
        };
        /**
         * This method is used to get the client proxy of a given connection.
         * it allows the server to call remote client function
         *
         * @function Server#getClient
         * @param {String} id - client identifier
         * @returns {Proxy}
         *
        * @example
        * //we suppose here that the clients are exposing hello() function
        * //onConnect event give the server an access to the client socket
        * server.onConnect(function (socket) {
        *      //get client proxy by socket ID
        *      var client = server.getClient(socket.id);
        *      //call remote hello() function.
        *      client.hello();
        * }
         */
        Server.prototype.getClient = function (id) {
            var conn = this.clients[id];
            if (conn === undefined)
                return false;
            if (conn.clientProxy !== undefined)
                return conn.clientProxy;
            conn.clientProxy = {};
            conn._proxy = conn.clientProxy;
            //this.importClientFunction(conn.client, conn, this.allowedF);
            this.stub.importRemoteFunction(conn.clientProxy, conn, conn.contract || this.allowedF, this.serialize);
            return conn.clientProxy;
        };
        /**
         * **!! Experimental !! **<br />
         * force regeneration of client remote function signatures
         * this is needed if for some reason we need to dynamically update allowed client functions at runtime
         * @function Server#updateClientAllowedFunctions
         * @param {String} id - client identifier
         */
        Server.prototype.updateClientAllowedFunctions = function (id) {
            var conn = this.clients[id];
            if (conn === undefined)
                return false;
            conn.clientProxy = {};
            conn._proxy = conn.clientProxy;
            //this.importClientFunction(conn.client, conn, this.allowedF);
            this.stub.importRemoteFunction(conn.clientProxy, conn, this.allowedF, this.serialize);
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
            if (this.transport.script && this.transport.script != '')
                this.scriptCache += fs.readFileSync(__dirname + this.transport.script);
            this.scriptCache += '\nvar _eureca_prefix = "' + prefix + '";\n';
            this.scriptCache += '\nvar _eureca_uri = "' + getUrl(request) + '";\n';
            this.scriptCache += '\nvar _eureca_host = "' + getUrl(request) + '";\n';
            //FIXME : override primus hardcoded pathname 
            this.scriptCache += '\nif (typeof Primus != "undefined") Primus.prototype.pathname = "/' + prefix + '";\n';
            this.scriptCache += fs.readFileSync(__dirname + '/EurecaClient.js');
            response.writeHead(200);
            response.write(this.scriptCache);
            response.end();
        };
        /**
         * **!! Experimental !! **<br />
         * Sends exported server functions to all connected clients <br />
         * This can be used if the server is designed to dynamically expose new methods.
         *
         * @function Server#updateContract
         */
        Server.prototype.updateContract = function () {
            this.contract = Eureca.Contract.ensureContract(this.exports, this.contract);
            for (var id in this.clients) {
                var socket = this.clients[id];
                var sendObj = {};
                sendObj[Eureca.Protocol.contractId] = this.contract;
                socket.send(JSON.stringify(sendObj));
            }
        };
        //this function is internally used to return value for asynchronous calls in the server side
        Server.returnFunc = function (result, error) {
            if (error === void 0) { error = null; }
            var retObj = {};
            retObj[Eureca.Protocol.signatureId] = this['retId'];
            retObj[Eureca.Protocol.resultId] = result;
            retObj[Eureca.Protocol.errorId] = error;
            this['connection'].send(JSON.stringify(retObj));
        };
        Server.prototype._handleServer = function (ioServer) {
            var _this = this;
            //ioServer.on('connection', function (socket) {
            ioServer.onconnect(function (socket) {
                //socket.siggg = 'A';
                socket.eureca.remoteAddress = socket.remoteAddress;
                _this.clients[socket.id] = socket;
                //Send EURECA contract
                var sendContract = function () {
                    _this.contract = Eureca.Contract.ensureContract(_this.exports, _this.contract);
                    var sendObj = {};
                    sendObj[Eureca.Protocol.contractId] = _this.contract;
                    if (_this.allowedF == 'all')
                        sendObj[Eureca.Protocol.signatureId] = socket.id;
                    socket.send(JSON.stringify(sendObj));
                };
                if (!_this.useAuthentication)
                    sendContract();
                //attach socket client
                socket.clientProxy = _this.getClient(socket.id);
                socket._proxy = socket.clientProxy;
                /**
                * Triggered each time a new client is connected
                *
                * @event Server#connect
                * @property {ISocket} socket - client socket.
                */
                _this.trigger('connect', socket);
                socket.on('message', function (message) {
                    /**
                    * Triggered each time a new message is received from a client.
                    *
                    * @event Server#message
                    * @property {String} message - the received message.
                    * @property {ISocket} socket - client socket.
                    */
                    _this.trigger('message', message, socket);
                    var jobj = _this.deserialize.call(socket, message);
                    //if (typeof message != 'object') {
                    //    try {
                    //        jobj = JSON.parse(message);
                    //    } catch (ex) { };
                    //}
                    //else {
                    //    jobj = message;
                    //}
                    if (jobj === undefined) {
                        _this.trigger('unhandledMessage', message, socket);
                        return;
                    }
                    //Handle authentication
                    if (jobj[Eureca.Protocol.authReq] !== undefined) {
                        if (typeof _this.settings.authenticate == 'function') {
                            var args = jobj[Eureca.Protocol.authReq];
                            args.push(function (error) {
                                if (error == null) {
                                    socket.eureca.authenticated = true;
                                    sendContract();
                                }
                                var authResponse = {};
                                authResponse[Eureca.Protocol.authResp] = [error];
                                socket.send(authResponse);
                            });
                            _this.settings.authenticate.apply(_this, args);
                        }
                        return;
                    }
                    if (_this.useAuthentication && !socket.eureca.authenticated) {
                        console.log('Authentication needed for ', socket.id);
                        return;
                    }
                    /** Experimental : dynamic client contract*/
                    //if (jobj[Eureca.Protocol.contractId] !== undefined) {
                    //    socket.contract = jobj[Eureca.Protocol.contractId];
                    //    return;
                    //}
                    /*****************************************/
                    //handle remote call
                    if (jobj[Eureca.Protocol.functionId] !== undefined) {
                        //                if (socket.context == undefined) {
                        //                    var returnFunc = function (result, error=null) {
                        //                        var retObj = {};
                        //                        retObj[Eureca.Protocol.signatureId] = this.retId;
                        //                        retObj[Eureca.Protocol.resultId] = result;
                        //retObj[Eureca.Protocol.errorId] = error;
                        //                        this.connection.send(JSON.stringify(retObj));
                        //                    }
                        //                    socket.context = { user: { clientId: socket.id }, connection: socket, socket: socket, clientProxy:socket.clientProxy, async: false, retId: jobj[Eureca.Protocol.signatureId], 'return': returnFunc };
                        //                }
                        //                socket.context.retId = jobj[Eureca.Protocol.signatureId];
                        //                _this.stub.invoke(socket.context, _this, jobj, socket);
                        var context = {
                            user: { clientId: socket.id },
                            connection: socket,
                            socket: socket,
                            clientProxy: socket.clientProxy,
                            async: false,
                            retId: jobj[Eureca.Protocol.signatureId],
                            return: Server.returnFunc
                        };
                        //context.retId = jobj[Eureca.Protocol.signatureId];
                        //if (!_this.settings.preInvoke || jobj[Eureca.Protocol.functionId] == 'authenticate' || (typeof _this.settings.preInvoke == 'function' && _this.settings.preInvoke.apply(context)))
                        //Experimental custom context sharing
                        //remote context is shared throught serverProxy or proxy function in the client side
                        //if (jobj[Eureca.Protocol.context]) {
                        //    socket.remoteContext = jobj[Eureca.Protocol.context];
                        //}
                        _this.stub.invoke(context, _this, jobj, socket);
                        return;
                    }
                    //handle remote response
                    if (jobj[Eureca.Protocol.signatureId] !== undefined) {
                        _this.stub.doCallBack(jobj[Eureca.Protocol.signatureId], jobj[Eureca.Protocol.resultId], jobj[Eureca.Protocol.errorId]);
                        return;
                    }
                    _this.trigger('unhandledMessage', message, socket);
                });
                socket.on('error', function (e) {
                    /**
                    * triggered if an error occure.
                    *
                    * @event Server#error
                    * @property {String} error - the error message
                    * @property {ISocket} socket - client socket.
                    */
                    _this.trigger('error', e, socket);
                });
                socket.on('close', function () {
                    /**
                    * triggered when the client is disconneced.
                    *
                    * @event Server#disconnect
                    * @property {ISocket} socket - client socket.
                    */
                    //console.log('disconnected deletting ', _this.clients);
                    _this.trigger('disconnect', socket);
                    delete _this.clients[socket.id];
                    //console.log('disconnected ', _this.clients);
                    //console.log('i', '#of clients changed ', EURECA.clients.length, );
                });
            });
        };
        //Removing need for Harmony proxies for simplification
        //private _checkHarmonyProxies()
        //{
        //    if (typeof Proxy == 'undefined' && !hproxywarn) {
        //        ELog.log('I', 'Harmony proxy not found', 'using workaround');
        //        ELog.log('I', 'to avoid this message please use : node --harmony-proxies <app>', '');
        //        hproxywarn = true;
        //    }
        //}
        /**
         * Sends exported server functions to all connected clients <br />
         * This can be used if the server is designed to dynamically expose new methods.
         *
         * @function attach
         * @memberof Server#
         * @param {Server} - a nodejs {@link https://nodejs.org/api/http.html#http_class_http_server|nodejs http server}
         *  or {@link http://expressjs.com/api.html#application|expressjs Application}
         *
         */
        Server.prototype.attach = function (server) {
            var app = server;
            if (server._events && server._events.request !== undefined && server.routes === undefined && server._events.request.on)
                app = server._events.request;
            //this._checkHarmonyProxies();
            this.allowedF = this.settings.allow || [];
            var _prefix = this.settings.prefix || 'eureca.io';
            var _clientUrl = this.settings.clientScript || '/eureca.js';
            var _transformer = this.settings.transformer;
            var _parser = this.settings.parser;
            //initialising server
            //var ioServer = io.attach(server, { path: '/'+_prefix });
            this.ioServer = this.transport.createServer(server, { prefix: _prefix, transformer: _transformer, parser: _parser });
            //console.log('Primus ? ', ioServer.primus);
            //var scriptLib = (typeof ioServer.primus == 'function') ? ioServer.primus.library() : null;
            var _this = this;
            this._handleServer(this.ioServer);
            //install on express
            //sockjs_server.installHandlers(server, {prefix:_prefix});            
            if (app.get && app.post) {
                app.get(_clientUrl, function (request, response) {
                    _this.sendScript(request, response, _prefix);
                });
            }
            else {
                app.on('request', function (request, response) {
                    if (request.method === 'GET') {
                        if (request.url.split('?')[0] === _clientUrl) {
                            _this.sendScript(request, response, _prefix);
                        }
                    }
                });
            }
            //console.log('>>>>>>>>>>>> ', app.get);
            //Workaround : nodejs 0.10.0 have a strange behaviour making remoteAddress unavailable when connecting from a nodejs client
            server.on('request', function (request, response) {
                if (!request.query)
                    return;
                var id = request.query.sid;
                var client = _this.clients[request.query.sid];
                if (client) {
                    client.eureca = client.eureca || {};
                    client.eureca.remoteAddress = client.eureca.remoteAddress || request.socket.remoteAddress;
                    client.eureca.remotePort = client.eureca.remotePort || request.socket.remotePort;
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

/// <reference path="../EObject.class.ts" />
/// <reference path="../Util.class.ts" />
/// <reference path="../Transport.ts" />
/// <reference path="../IServer.interface.ts" />
/// <reference path="../ISocket.interface.ts" />


/** @ignore */
declare var __dirname;
/** @ignore */
declare var process;
/** @ignore */
declare var require;
/** @ignore */
declare var Primus: any;
/** @ignore */
module Eureca.Transports.PrimusTransport {

    if (Eureca.Util.isNodejs) {
        Primus = require('primus');
    }

    export class Socket extends EObject implements ISocket {
        public request;
        public id;
        public remoteAddress;
        public eureca:any = {};

        //public webRTCChannel:any;
        //private wRTCPeer;
        constructor(public socket?: any) {
            super();
            this.request = socket.request;
            this.id = socket.id;
            //FIXME : with nodejs 0.10.0 remoteAddress of nodejs clients is undefined (this seems to be a engine.io issue)            
            this.remoteAddress = socket.address;

            //this.registerEvents(['open', 'message', 'error', 'close', 'reconnecting']);

            this.bindEvents();
        }
        private bindEvents() {
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

        isAuthenticated(): boolean {
            return this.eureca.authenticated;
        }
        send(data/*, webRTC=false*/) {
            
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
        }
        close() {
            if (this.socket.end) {
                this.socket.end();
            }
            else {
                this.socket.close();
            }
        }


        //deprecated ?
        onopen(callback: (any?) => void) {
            this.socket.on('open', callback);
        }
        onmessage(callback: (any?) => void) {
            this.socket.on('data', callback);
        }
        onclose(callback: (any?) => void) {
            this.socket.on('end', callback);
        }
        onerror(callback: (any?) => void) {
            this.socket.on('error', callback);
        }
        ondisconnect(callback: (any?) => void) {
            this.socket.on('reconnecting', callback);
        }
    }
    export class Server implements IServer {

        constructor(public primus: any) {
        }
        //on client connect
        onconnect(callback: (Socket) => void) {
            this.primus.on('connection', function (psocket) {
                var socket = new Socket(psocket)
                //Eureca.Util.extend(iosocket, socket);
                callback(socket);
            });
        }

    }

    
    var createServer = function (hook, options: any = {}) {

        try {
            //var primusOptions: any = {};
            options.pathname = options.prefix ? '/' + options.prefix : undefined;
            var primus = new Primus(hook, options);

// // sync middleware
// primus.use('eureca', function (req, res) {
//     console.log('EURECA middleware in action');
    
//     req.tag='eureca.io';
//     console.log('>> req.tag=',req.tag);
//     console.log('>> req=',req.headers.cookie);
// });                
            //primus.save(__dirname + '/js/primus.js');
            var primusTransport = Transport.get('primus');
            //populate the client script
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
    }



    var createClient = function (uri, options: any = {}) {
        
        options.pathname = options.prefix ? '/' + options.prefix : undefined;
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
    }
    //Transport.register('primus', '/js/primus.js', createClient, createServer);

    //set empty client script by default, it'll be populated by createClient function
    Transport.register(
        'primus', '', 
        createClient, createServer, 
        (v)=>v, 
        (v)=>v
    );
    
}

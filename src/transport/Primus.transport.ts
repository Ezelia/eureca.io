/// <reference path="../EObject.class.ts" />
/// <reference path="../Util.class.ts" />
/// <reference path="../Transport.ts" />
/// <reference path="../IServer.interface.ts" />
/// <reference path="../ISocket.interface.ts" />
declare var __dirname;
declare var process;
declare var require;
declare var Primus: any;

module Eureca.Transports.PrimusTransport {

    if (Eureca.Util.isNodejs) {
        Primus = require('primus');
    }

    export class Socket implements ISocket {
        public request;
        public id;
        public remoteAddress;
        constructor(public socket?: any) {
            this.request = socket.request;
            this.id = socket.id;
            //FIXME : with nodejs 0.10.0 remoteAddress of nodejs clients is undefined (this seems to be a engine.io issue)
            this.remoteAddress = socket.address;
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

        constructor(public primus: any) { }
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
    }



    var createClient = function (uri, options: any = {}) {
        
        options.pathname = options.prefix ? '/' + options.prefix : undefined;
        var socket;
        if (Eureca.Util.isNodejs) {
            //eioptions.transports = ['websocket', 'polling', 'flashsocket'];
            //console.log('connecting to ', uri, options);
            var CSocket = Primus.createSocket(options);
            
            socket = new CSocket(uri);
            
        } else {
            socket = new Primus(uri, options);
        }
        var client = new Socket(socket);
        //(<any>client).send = socket.send;
        //socket.onopen = client.onopen;
        //Eureca.Util.extend(socket, client);


        return client;
    }
    Transport.register('primus', '/js/primus.js', createClient, createServer);
}

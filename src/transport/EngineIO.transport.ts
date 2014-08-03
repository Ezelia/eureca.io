//Deprecated, Primus do the job :)

/// <reference path="../EObject.class.ts" />
/// <reference path="../Util.class.ts" />
/// <reference path="../Transport.ts" />
/// <reference path="../IServer.interface.ts" />
/// <reference path="../ISocket.interface.ts" />

declare var require;
declare var eio: any;
module Eureca.Transports.EngineIO {

    export class Socket implements ISocket {
        public request;
        public id;
        public remoteAddress;
        constructor(public socket?:any)
        {
            this.request = socket.request;
            this.id = socket.id;
            //FIXME : with nodejs 0.10.0 remoteAddress of nodejs clients is undefined (this seems to be a engine.io issue)
            this.remoteAddress = (socket && socket.request) ? socket.request.connection.remoteAddress : undefined;
        }
        send(data)
        {
            this.socket.send(data);
        }
        close()
        {
            this.socket.close();
        }
        onopen(callback: (any?) => void )
        {
            this.socket.on('open', callback);
        }
        onmessage(callback: (any?) => void )
        {
            this.socket.on('message', callback);
        }
        onclose(callback: (any?) => void )
        {
            this.socket.on('close', callback);
        }
        onerror(callback: (any?) => void )
        {
            this.socket.on('error', callback);
        }
        ondisconnect(callback: (any?) => void )
        {
            this.socket.onclose = callback;
        }
    }
    export class Server implements IServer {
        
        constructor(public engineIOServer:any){}
        onconnect(callback: (Socket) => void )
        {
            this.engineIOServer.on('connection', function (iosocket) {
                var socket = new Socket(iosocket)
                //Eureca.Util.extend(iosocket, socket);
                callback(socket);
            });
        }
    }

    var createServer = function (hook, options: any = {})
    {
        var eioptions: any = {};
        eioptions.path = options.prefix ? '/' + options.prefix : undefined;

        var io = require('engine.io');
        var server;
        var isPort = /^[\d]+$/.test(hook);
        if (isPort)
        {            
            var port = parseInt(hook);
            //console.log('standalone on ', port);
            server = new Server(io.listen(port, eioptions));
        }
        else if (typeof hook == 'object')
        {
            server = new Server(io.attach(hook, eioptions));
        }
        return server;
    }

    var createClient = function (uri, options: any = {})
    {
        var eioptions:any = {};
        eioptions.path = options.prefix ? '/' + options.prefix : undefined;
        
        var socket;
        if (Eureca.Util.isNodejs) {
            //eioptions.transports = ['websocket', 'polling', 'flashsocket'];
            console.log('connecting to ', uri, options, eioptions);
            socket = require('engine.io-client')(uri, eioptions);
        } else {
            socket = new eio.Socket(uri, eioptions);
        }
        var client = new Socket(socket);
        //(<any>client).send = socket.send;
        //socket.onopen = client.onopen;
        //Eureca.Util.extend(socket, client);
        

        return client;
    }
    Transport.register('engine.io', '/js/engine.io.js', createClient, createServer);
}

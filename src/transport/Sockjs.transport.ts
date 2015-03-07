//Deprecated, Primus do the job :)

/// <reference path="../EObject.class.ts" />
/// <reference path="../Util.class.ts" />
/// <reference path="../Transport.ts" />
/// <reference path="../IServer.interface.ts" />
/// <reference path="../ISocket.interface.ts" />

/** @ignore */
declare var require;
/** @ignore */
declare var SockJS: any;
/** @ignore */
module Eureca.Transports.Sockjs {

    export class Socket implements ISocket {
        public request;
        public id;
        public remoteAddress;
        constructor(public socket?: any) {
            this.id = socket.id;
            
            this.remoteAddress = socket.address? socket.address.address : undefined;
        }
        send(data) {
            if (this.socket.send) {
                this.socket.send(data);
            }
            else
            {
                this.socket.write(data);
            }
        }
        close() {
            //throw Error('close() not implemented');
            this.socket.close();
        }
        onopen(callback: (any?) => void ) {
            if (Eureca.Util.isNodejs) {
                this.socket.on('connection', function (e) {
                    callback(e);
                });
            }
            else {
                
                this.socket.onopen = function (e) {
                    callback(e);
                }
            }
        }
        onmessage(callback: (any?) => void ) {

            if (Eureca.Util.isNodejs) {
                this.socket.on('data', function (e) {
                    callback(e);
                });
            }
            else {
                this.socket.onmessage = function (e) {
                    callback(e.data);
                }
            }

        }
        onclose(callback: (any?) => void ) {
            
            if (Eureca.Util.isNodejs) {
                this.socket.on('close', function (e) {
                    callback(e);
                });
            }
            else {
                this.socket.onclose = function (e) {
                    callback(e);
                };
            }
        }
        onerror(callback: (any?) => void ) {            
            if (Eureca.Util.isNodejs) {
                this.socket.on('error', function (e) {                    
                    callback(e);
                });
            }
            else {
                this.socket.onerror = function (e) {
                    callback(e);
                };
            }
        }
        ondisconnect(callback: (any?) => void ) {
            this.socket.onclose = callback;
        }
    }
    export class Server implements IServer {

        constructor(public sockjsServer: any) {

            
        }
        onconnect(callback: (Socket) => void ) {
            this.sockjsServer.on('connection', function (iosocket) {
                var socket = new Socket(iosocket)
                callback(socket);
            });
        }
        
    }

    var createServer = function (hook, options: any = {}) {
        var sjsoptions: any = {};
        sjsoptions.prefix = options.prefix ? '/' + options.prefix : undefined;

        var isPort = /^[\d]+$/.test(hook);
        if (isPort) {
            throw Error('Error - eureca.listen(port) is not implemented on sockjs transport');
        }

        var sockjs = require('sockjs');
        var sockjs_server = sockjs.createServer();
        sockjs_server.installHandlers(hook, sjsoptions);

        var server = new Server(sockjs_server);
        return server;
    }

    var createClient = function (uri, options: any = {}) {
        var sjsoptions: any = {};
        sjsoptions.prefix = options.prefix ? options.prefix : undefined;


        var socket;
        if (Eureca.Util.isNodejs) {

            socket = require('sockjs-client').create(uri + sjsoptions.prefix);
        } else {
            socket = new SockJS(uri);
        }


        var client = new Socket(socket);

        return client;
    }
    Transport.register('sockjs', '/js/sockjs-0.3.min.js', createClient, createServer);
}

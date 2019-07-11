/// <reference path="../EObject.class.ts" />
/// <reference path="../Util.class.ts" />
/// <reference path="../Transport.ts" />
/// <reference path="../IServer.interface.ts" />
/// <reference path="../ISocket.interface.ts" />
/// <reference path="WebRTCPeer.ts" />

/** @ignore */
declare var __dirname;
/** @ignore */
declare var process;
/** @ignore */
declare var require;
/** @ignore */
declare var webrtc: any;
/** @ignore */
module Eureca.Transports.WebRTCTransport {
    var qs, http;
    if (Eureca.Util.isNodejs) {
        qs = require('querystring');
        http = require('http');
        try {
            webrtc = require('wrtc');
        } catch (e) {
            //console.error("WebRTC not be available, you need to install wrtc module");
            //process.exit(e.code);
            webrtc = {};
        }

    }


    export class Socket extends EObject implements ISocket {
        public request;
        public id;
        public remoteAddress;
        public eureca: any = {};
        


        private wRTCPeer;
        constructor(public socket?: any, public peer?: WebRTC.Peer) {
            super();
            //this.request = socket.request;
            this.id = peer && peer.id ? peer.id : Util.randomStr(16);

            if (socket && socket.request) this.request = socket.request;

            //FIXME : with nodejs 0.10.0 remoteAddress of nodejs clients is undefined (this seems to be a engine.io issue)            
            //this.remoteAddress = socket.address;

            //this.registerEvents(['open', 'message', 'error', 'close', 'reconnecting']);

            this.bindEvents();
        }

        public update(socket?: any) {
            if (this.socket != null) {
                this.socket.onopen = null;
                this.socket.onmessage = null;
                this.socket.onclose = null;
                this.socket.onerror = null;
            }




            this.socket = socket;


            this.bindEvents();

        }
        private bindEvents() {
            if (this.socket == null) return;


            var __this = this;
            this.socket.onopen = function () {
                __this.trigger('open');
            }

            this.socket.onmessage = function (event) {
                __this.trigger('message', event.data);
            }

            this.socket.onclose = function () {
                __this.trigger('close');
            };

            this.socket.onerror = function (error) {
                __this.trigger('error', error);
            };


            if (this.peer) {
            //    this.peer.unbindEvent('disconnected');
            //    this.peer.on('disconnected', function () {
            //        _this.trigger('close');
            //    });
               this.peer.on('stateChange', function (s) {
                    __this.trigger('stateChange', s);


                    // if (s === 'completed')  //we need to wait for state 'completed' before considering WebRTC connection estabilished
                    //     __this.trigger('connect');
               });            
            }
            /*
            this.socket.on('reconnecting', function () {
                var args = arguments.length > 0 ? Array.prototype.slice.call(arguments, 0) : [];
                args.unshift('reconnecting');
                _this.trigger.apply(_this, args);
            });
            */
        }

        isAuthenticated(): boolean {
            return this.eureca.authenticated;
        }
        send(data) {
            
            if (this.socket == null) return;
            this.socket.send(data);
        }
        close() {
            this.socket.close();
        }


        //deprecated ?
        onopen(callback: (any?) => void) {
            this.on('open', callback);
        }
        onmessage(callback: (any?) => void) {
            this.on('message', callback);
        }
        onclose(callback: (any?) => void) {
            this.on('close', callback);
        }
        onerror(callback: (any?) => void) {
            this.on('error', callback);
        }
        ondisconnect(callback: (any?) => void) {
            //this.socket.on('reconnecting', callback);
        }
    }


    export class Server implements IServer {


        private processPost(request, response, callback) {
            var queryData = "";
            if (typeof callback !== 'function') return null;

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

            } else {
                response.writeHead(405, { 'Content-Type': 'text/plain' });
                response.end();
            }
        }
        private serverPeer: WebRTC.Peer = new WebRTC.Peer();
        constructor(public appServer: any, options:any) {
            var __this = this;


            var app = appServer;
            if (appServer._events.request !== undefined && appServer.routes === undefined) app = appServer._events.request;

            if (app.get && app.post) {
                app.post('/webrtc-' + options.prefix, function (request, response) {

                    if (request.body) //body parser present
                    {
                        var offer = request.body[Protocol.signal];
                        __this.serverPeer.getOffer(offer, request, function (pc) {
                            var resp = {};
                            resp[Protocol.signal] = pc.localDescription;


                            response.write(JSON.stringify(resp));
                            response.end();
                        });
                        return;
                    } 
                    __this.processPost(request, response, function () {
                        var offer = request.post[Protocol.signal];
                        response.writeHead(200, "OK", { 'Content-Type': 'text/plain' });

                        __this.serverPeer.getOffer(offer, request, function (pc) {
                            var resp = {};
                            resp[Protocol.signal] = pc.localDescription;


                            response.write(JSON.stringify(resp));
                            response.end();
                        });

                    });

                });
            }

            else {
                //we use POST request for webRTC signaling            
                appServer.on('request', function (request, response) {
                    if (request.method === 'POST') {
                        if (request.url.split('?')[0] === '/webrtc-' + options.prefix) {
                        __this.processPost(request, response, function () {

                            var offer = request.post[Protocol.signal];
                            response.writeHead(200, "OK", { 'Content-Type': 'text/plain' });

                            __this.serverPeer.getOffer(offer, request, function (pc) {
                                var resp = {};
                                resp[Protocol.signal] = pc.localDescription;


                                response.write(JSON.stringify(resp));
                                response.end();
                            });

                        });
                        }
                    }
                });
            }

            __this.serverPeer.on('stateChange', function(s) {
                __this.appServer.eurecaServer.trigger('stateChange', s);
            });
            
        }

        
        onconnect(callback: (Socket) => void) {

            this.serverPeer.on('datachannel', function (datachannel) {
                var socket = new Socket(datachannel);

                callback(socket);
            });
        }


    }

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
    }



    var createClient = function (uri, options: any = {}) {
        
        options.pathname = options.prefix ? '/' + options.prefix : undefined;
        options.path = options.prefix ? '/' + options.prefix : undefined;
        var clientPeer: WebRTC.Peer;
        clientPeer = new WebRTC.Peer(options);

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

            clientPeer.makeOffer(function (pc) 
            {
                if (Eureca.Util.isNodejs) {


                    

                    var url = require("url");

                    var postDataObj = {};
                    postDataObj[Protocol.signal] = JSON.stringify(pc.localDescription);

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

                            clientPeer.getAnswer(resp[Protocol.signal]);
                            retries = options.retries;
                        });
                    });


                    post_req.write(post_data);
                    post_req.end();

                    post_req.on('error', function (error) {
                        setTimeout(function () { signal(); }, 3000);
                    });
                    //
                } else {

                    var xhr = new XMLHttpRequest();


                    var params = Protocol.signal + '=' + JSON.stringify(pc.localDescription);

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

                    xhr.onreadystatechange = function () {//Call a function when the state changes.
                        if (xhr.readyState == 4 && xhr.status == 200) {

                            var resp = JSON.parse(xhr.responseText);

                            clientPeer.getAnswer(resp[Protocol.signal]);
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
                
            },
            function(error) {

                client.trigger('error', error);
            }
        );
        }


        signal();


        //if connection timeout
        clientPeer.on('timeout', ()=> {
            
            signal();
        });

        return client;
    }

    
    const deserialize = (message) => {
        var jobj;
        if (typeof message != 'object') {
            try {
                jobj = JSON.parse(message);
            } catch (ex) { };
        }
        else {
            jobj = message;
        }
        return jobj;
    }    
    
    Transport.register('webrtc', '', createClient, createServer, JSON.stringify, deserialize);
}

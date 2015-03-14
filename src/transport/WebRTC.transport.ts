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


            var _this = this;
            this.socket.onopen = function () {
                _this.trigger('open');
            }

            this.socket.onmessage = function (event) {
                _this.trigger('message', event.data);
            }

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
        }

        isAuthenticated(): boolean {
            return this.eureca.authenticated;
        }
        send(data) {
            //console.log('sending ', data);
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
        constructor(public server: any, options:any) {
            var _this = this;


            var app = server;
            if (server._events.request !== undefined && server.routes === undefined) app = server._events.request;

            if (app.get && app.post) {
                app.post('/webrtc-' + options.prefix, function (request, response) {
                    _this.processPost(request, response, function () {
                        //console.log('Got post data', request.post);

                        var offer = request.post[Protocol.signal];
                        response.writeHead(200, "OK", { 'Content-Type': 'text/plain' });

                        _this.serverPeer.getOffer(offer, function (desc) {
                            var resp = {};
                            resp[Protocol.signal] = desc;


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

                            var offer = request.post[Protocol.signal];
                            response.writeHead(200, "OK", { 'Content-Type': 'text/plain' });

                            _this.serverPeer.getOffer(offer, function (desc) {
                                var resp = {};
                                resp[Protocol.signal] = desc;


                                response.write(JSON.stringify(resp));
                                response.end();
                            });

                        });
                        }
                    }
                });
            }
        }
        onconnect(callback: (Socket) => void) {
            this.serverPeer.on('open', function (datachannel) {
                var socket = new Socket(datachannel)
                //Eureca.Util.extend(iosocket, socket);
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

            clientPeer.makeOffer(function (pc) {
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

                            //console.log('Response: ' + resp['__signal__']);
                            clientPeer.getAnswer(resp[Protocol.signal]);
                            retries = options.retries;
                        });
                    });


                    post_req.write(post_data);
                    post_req.end();

                    post_req.on('error', function (error) {
                        //console.log('E = ', error);
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
                        //console.log('XHR = ', xhr.readyState, xhr.status);
                        if (xhr.readyState == 4 && xhr.status == 200) {

                            var resp = JSON.parse(xhr.responseText);

                            clientPeer.getAnswer(resp[Protocol.signal]);
                            retries = options.retries;


                            console.log('Got response ', resp);
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
                
            });
        }


        signal();


        //if connection timeout
        clientPeer.on('timeout', signal);

        return client;
    }
    Transport.register('webrtc', '', createClient, createServer);
}

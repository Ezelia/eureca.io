/// <reference path="transport/Primus.transport.ts" />
/// <reference path="transport/WebRTC.transport.ts" />
/// <reference path="Transport.ts" />
/// <reference path="Stub.ts" />
/// <reference path="EObject.class.ts" />
/// <reference path="Contract.class.ts" />

/** @ignore */
declare var require: any;

/** @ignore */
declare var exports: any;

/** @ignore */
declare var __dirname: any;

/** @ignore */
declare var Proxy: any;

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

module Eureca  {


        /**
         * Eureca server constructor
         * This constructor takes an optional settings object
         * @constructor Server
         * @param {object} [settings] - have the following properties
         * @property {string} [settings.transport=engine.io] - can be "engine.io", "sockjs", "websockets", "faye" or "browserchannel" by default "engine.io" is used
         * @property {function} [settings.authenticate] - If this function is defined, the client will not be able to invoke server functions until it successfully call the client side authenticate method, which will invoke this function.
         * @property {function} [settings.serialize] - If defined, this function is used to serialize the request object before sending it to the client (default is JSON.stringify). This function can be useful to add custom information/meta-data to the transmitted request.
         * @property {function} [settings.deserialize] - If defined, this function is used to deserialize the received response string.

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
    export class Server extends EObject {
        

        public contract: any[];
        public debuglevel: number;


        public allowedF: any;
        public clients: any;

        private transport: any;
        public stub: Stub;
        private scriptCache: string = '';

        private serialize = JSON.stringify;
        private deserialize = function (message) {
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


        private useAuthentication:boolean;

        public ioServer;

        
        /**
        * All declared functions under this namespace become available to the clients.
        * @namespace Server exports
        * @memberOf Server
        * 
        * @example
        * var Eureca = require('eureca.io');
        * //use default transport
        * var server = new Eureca.Server();
        * server.exports.add = function(a, b) {
        *      return a + b;
        * }
        */
        public exports: any;


        constructor(public settings: any = {}) {
            super();
            
            if (typeof settings.serialize == 'function')
                this.serialize = settings.serialize;
            else
                settings.serialize = this.serialize;

            if (typeof settings.deserialize == 'function')
                this.deserialize = settings.deserialize;
            else
                settings.deserialize = this.deserialize;

            


            this.stub = new Stub(settings);
            
            settings.transformer = settings.transport || 'engine.io';
            this.transport = Transport.get(settings.transformer);
            


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



        public onConnect(callback: (any) => void) {
            this.on('connect', callback);
        }
        public onDisconnect(callback: (any) => void) {
            this.on('disconnect', callback);
        }
        public onMessage(callback: (any) => void) {
            this.on('message', callback);
        }
        public onError(callback: (any) => void) {
            this.on('error', callback);
        }



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
        public getClient(id) {
            
            var conn = this.clients[id];
            
            if (conn === undefined) return false;
            if (conn.clientProxy !== undefined) return conn.clientProxy;

            conn.clientProxy = {};
            conn._proxy = conn.clientProxy;
            //this.importClientFunction(conn.client, conn, this.allowedF);
            this.stub.importRemoteFunction(conn.clientProxy, conn, conn.contract || this.allowedF/*, this.serialize*/);

            
            return conn.clientProxy;
        }

        /**
         * **!! Experimental !! **<br />
         * force regeneration of client remote function signatures
         * this is needed if for some reason we need to dynamically update allowed client functions at runtime
         * @function Server#updateClientAllowedFunctions
         * @param {String} id - client identifier
         */
        public updateClientAllowedFunctions(id) {
            

            var conn = this.clients[id];
            
            if (conn === undefined) return false;

            conn.clientProxy = {};
            conn._proxy = conn.clientProxy;
            //this.importClientFunction(conn.client, conn, this.allowedF);
            this.stub.importRemoteFunction(conn.clientProxy, conn, this.allowedF/*, this.serialize*/);
        }

        public getConnection (id) {
            return this.clients[id];
        }




        private sendScript(request, response, prefix) {
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
            this.scriptCache += '\nif (typeof Primus != "undefined") Primus.prototype.pathname = "/' + prefix+'";\n';
            this.scriptCache += fs.readFileSync(__dirname + '/EurecaClient.js');

            response.writeHead(200);
            response.write(this.scriptCache);
            response.end();
        }

        /**
         * **!! Experimental !! **<br />
         * Sends exported server functions to all connected clients <br />
         * This can be used if the server is designed to dynamically expose new methods.
         * 
         * @function Server#updateContract
         */
        public updateContract() {
            this.contract = Contract.ensureContract(this.exports, this.contract);
            for (var id in this.clients) {
                var socket = this.clients[id];

                var sendObj = {};
                sendObj[Eureca.Protocol.contractId] = this.contract;
                socket.send(JSON.stringify(sendObj));
            }
        }

        //this function is internally used to return value for asynchronous calls in the server side
        private static returnFunc (result, error = null) {
            var retObj = {};
            retObj[Eureca.Protocol.signatureId] = this['retId'];
            retObj[Eureca.Protocol.resultId] = result;
            retObj[Eureca.Protocol.errorId] = error;
            this['connection'].send(JSON.stringify(retObj));
        }

        private _handleServer(ioServer:IServer)
        {
            var _this = this;

            //ioServer.on('connection', function (socket) {
            ioServer.onconnect(function (socket) {
                
                //socket.siggg = 'A';
                
                socket.eureca.remoteAddress = (<any>socket).remoteAddress;

                _this.clients[socket.id] = socket;

                //Send EURECA contract

                var sendContract = function () {

                    _this.contract = Contract.ensureContract(_this.exports, _this.contract);
                    var sendObj = {};
                    sendObj[Eureca.Protocol.contractId] = _this.contract;

                    if (_this.allowedF == 'all')
                        sendObj[Eureca.Protocol.signatureId] = socket.id;

                    socket.send(JSON.stringify(sendObj));
                }

                if (!_this.useAuthentication) sendContract();


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
                    

                    var context: any;

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
                        
                        if (typeof _this.settings.authenticate == 'function')
                        {
                            var args = jobj[Eureca.Protocol.authReq];

                            args.push(function (error) {
                                if (error == null) {
                                    socket.eureca.authenticated = true;
                                    sendContract();
                                    //Todo : trigger authenticated event
                                }

                                var authResponse = {};
                                authResponse[Eureca.Protocol.authResp] = [error];
                                socket.send(authResponse);

                                _this.trigger('authentication', error);
                            });

                            var context:any = {
                                user: { clientId: socket.id },
                                connection: socket,
                                socket: socket,
                            };

                            _this.settings.authenticate.apply(context, args);

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

                            var context:any = {
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
                    if (jobj[Eureca.Protocol.signatureId] !== undefined) //invoke result
                    {
                        //_this.stub.doCallBack(jobj[Eureca.Protocol.signatureId], jobj[Eureca.Protocol.resultId], jobj[Eureca.Protocol.errorId]);
                        Stub.doCallBack(jobj[Eureca.Protocol.signatureId], jobj[Eureca.Protocol.resultId], jobj[Eureca.Protocol.errorId]);
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

        }

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
        public attach (server:any) {

            var app = server;
            if (server._events && server._events.request !== undefined && server.routes === undefined && server._events.request.on) app = server._events.request;
            //this._checkHarmonyProxies();

            this.allowedF = this.settings.allow || [];
            var _prefix = this.settings.prefix || 'eureca.io';
            var _clientUrl = this.settings.clientScript || '/eureca.js';
            var _transformer = this.settings.transformer;
            var _parser = this.settings.parser;

            //initialising server
            //var ioServer = io.attach(server, { path: '/'+_prefix });
            this.ioServer = this.transport.createServer(server, { prefix: _prefix, transformer:_transformer, parser:_parser });
            //console.log('Primus ? ', ioServer.primus);

            //var scriptLib = (typeof ioServer.primus == 'function') ? ioServer.primus.library() : null;

            var _this = this;

            this._handleServer(this.ioServer);



            //install on express
            //sockjs_server.installHandlers(server, {prefix:_prefix});            
            if (app.get && app.post)  //TODO : better way to detect express
            {

                
                app.get(_clientUrl, function (request, response) {
                    _this.sendScript(request, response, _prefix);
                });
            }
            else  //Fallback to nodejs
            {
                
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
                if (!request.query) return;

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
        }
    }

}


exports.Eureca = Eureca;

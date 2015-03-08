/// <reference path="transport/Primus.transport.ts" />
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
         * @param {enum} [settings=null] - have the following properties
         * @property {string} [settings.transport=engine.io] - can be "engine.io", "sockjs", "websockets", "faye" or "browserchannel" by default "engine.io" is used
         * 
         * @example
         * var Eureca = require('eureca.io');
         * //use default transport
         * var server = new Eureca.Server();
         * 
         * 
         * @example
         * var Eureca = require('eureca.io');
         * //use websockets transport
         * var server = new Eureca.Server({transport:'websockets'});
         * 
         * 
         * @see attach
         * @see getClient
         * 
         * 
         */
    export class Server extends EObject {
        private version = '0.6.0-dev';

        public contract: any[];
        public debuglevel: number;


        public allowedF: any[];
        public clients: any;

        private transport: any;
        private stub: Stub;
        private scriptCache: string = '';



        
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
            

            this.stub = new Stub(settings);

            settings.transformer = settings.transport || 'engine.io';
            settings.transport = 'primus';

            console.log('* using primus:' + settings.transformer);

            this.transport = Transport.get(settings.transport);

            this.contract = [];
            this.debuglevel = settings.debuglevel || 1;

            //Removing need for Harmony proxies for simplification
            //var _exports = {};            
            //this.exports = Contract.proxify(_exports, this.contract);

            this.exports = {};
            this.allowedF = [];

            this.clients = {};


            if (typeof this.settings.authenticate == 'function')
                this.exports.authenticate = this.settings.authenticate;

            this.registerEvents(['onConnect', 'onDisconnect', 'onMessage', 'onError']);

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
            if (conn.client !== undefined) return conn.client;
            conn.client = {};
            //this.importClientFunction(conn.client, conn, this.allowedF);
            this.stub.importRemoteFunction(conn.client, conn, this.allowedF);

            
            return conn.client;
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
            conn.client = {};
            //this.importClientFunction(conn.client, conn, this.allowedF);
            this.stub.importRemoteFunction(conn.client, conn, this.allowedF);
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
            this.scriptCache += fs.readFileSync(__dirname + this.transport.script);
            this.scriptCache += '\nvar _eureca_prefix = "' + prefix + '";\n';
            this.scriptCache += '\nvar _eureca_uri = "' + getUrl(request) + '";\n';
            this.scriptCache += '\nvar _eureca_host = "' + getUrl(request) + '";\n';

            //FIXME : override primus hardcoded pathname 
            this.scriptCache += '\nPrimus.prototype.pathname = "/' + prefix+'";\n';
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



        private _handleServer(ioServer:IServer)
        {
            var _this = this;
            //ioServer.on('connection', function (socket) {
            ioServer.onconnect(function (socket) {
                
                //socket.siggg = 'A';
                
                socket.eureca.remoteAddress = (<any>socket).remoteAddress;

                _this.clients[socket.id] = socket;

                //Send EURECA contract

                _this.contract = Contract.ensureContract(_this.exports, _this.contract);

                var sendObj = {};
                sendObj[Eureca.Protocol.contractId] = _this.contract;
                socket.send(JSON.stringify(sendObj));


                /**
                * Triggered each time a new client is connected
                *
                * @event Server#onConnect
                * @property {ISocket} socket - client socket.
                */
                _this.trigger('onConnect', socket);


                socket.on('message', function (message) {

                    /**
                    * Triggered each time a new message is received from a client.
                    *
                    * @event Server#onMessage
                    * @property {String} message - the received message.
                    * @property {ISocket} socket - client socket.
                    */
                    _this.trigger('onMessage', message, socket);

                    var jobj;
                    try {
                        jobj = JSON.parse(message);
                    } catch (ex) { };

                    if (jobj === undefined) return;
                    if (jobj[Eureca.Protocol.functionId] !== undefined) {

                        var returnFunc = function (result) {
                            var retObj = {};
                            retObj[Eureca.Protocol.signatureId] = this.retId;
                            retObj[Eureca.Protocol.resultId] = result;
                            this.connection.send(JSON.stringify(retObj));
                        }

                        var context: any = { user: { clientId: socket.id }, connection: socket, async: false, retId: jobj[Eureca.Protocol.signatureId], 'return': returnFunc };


                        if (!_this.settings.preInvoke || jobj[Eureca.Protocol.functionId] == 'authenticate' || (typeof _this.settings.preInvoke == 'function' && _this.settings.preInvoke.apply(context)))
                            _this.stub.invoke(context, _this, jobj, socket);


                        return;
                    }

                    if (jobj[Eureca.Protocol.signatureId] !== undefined) //invoke result
                    {
                        _this.stub.doCallBack(jobj[Eureca.Protocol.signatureId], jobj[Eureca.Protocol.resultId]);
                        return;
                    }
                });

                socket.on('error', function (e) {


                    /**
                    * triggered if an error occure.
                    *
                    * @event Server#onError
                    * @property {String} error - the error message
                    * @property {ISocket} socket - client socket.
                    */
                    _this.trigger('onError', e, socket);
                });


                socket.on('close', function () {

                    /**
                    * triggered when the client is disconneced.
                    *
                    * @event Server#onDisconnect
                    * @property {ISocket} socket - client socket.
                    */
                    _this.trigger('onDisconnect', socket);
                    delete _this.clients[socket.id];
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
            if (server._events.request !== undefined && server.routes === undefined) app = server._events.request;

            //this._checkHarmonyProxies();

            this.allowedF = this.settings.allow || [];
            var _prefix = this.settings.prefix || 'eureca.io';
            var _clientUrl = this.settings.clientScript || '/eureca.js';
            var _transformer = this.settings.transformer;
            var _parser = this.settings.parser;

            //initialising server
            //var ioServer = io.attach(server, { path: '/'+_prefix });
            var ioServer = this.transport.createServer(server, { prefix: _prefix, transformer:_transformer, parser:_parser });
            //console.log('Primus ? ', ioServer.primus);

            //var scriptLib = (typeof ioServer.primus == 'function') ? ioServer.primus.library() : null;

            var _this = this;

            this._handleServer(ioServer);



            //install on express
            //sockjs_server.installHandlers(server, {prefix:_prefix});            
            if (app.get)  //TODO : better way to detect express
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

            //Workaround : nodejs 0.10.0 have a strange behaviour making remoteAddress unavailable when connecting from a nodejs client
            server.on('request', function (req, res) {                
                if (!req.query) return;

                var id = req.query.sid;
                var client = _this.clients[req.query.sid];
                
                if (client)
                {                 
                       
                    client.eureca = client.eureca || {};                    
                    client.eureca.remoteAddress = client.eureca.remoteAddress || req.socket.remoteAddress;
                    client.eureca.remotePort = client.eureca.remotePort || req.socket.remotePort;                    
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
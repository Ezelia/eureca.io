/// <reference path="transport/Primus.transport.ts" />
/// <reference path="Transport.ts" />
/// <reference path="Stub.ts" />
/// <reference path="EObject.class.ts" />
/// <reference path="Contract.class.ts" />

declare var require: any;
declare var exports: any;
declare var __dirname: any;
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

    // Class
    export class Server extends EObject {
        private version = '0.6.0-dev';

        public contract: any[];
        public debuglevel: number;
        public exports: any;
        public allowedF: any[];
        public clients: any;

        private transport: any;
        private stub: Stub;
        private scriptCache: string = '';

        // Constructor
        constructor(public settings: any = {}) {
            super();
            

            this.stub = new Stub(settings);

            settings.transformer = settings.transport || 'engine.io';
            settings.transport = 'primus';

            console.log('* using primus:' + settings.transformer);

            this.transport = Transport.get(settings.transport);

            this.contract = [];
            this.debuglevel = settings.debuglevel || 1;

            var _exports = {};
            this.exports = Contract.proxify(_exports, this.contract);
            this.allowedF = [];

            this.clients = {};


            if (typeof this.settings.authenticate == 'function')
                this.exports.authenticate = this.settings.authenticate;

            this.registerEvents(['onConnect', 'onDisconnect', 'onMessage', 'onError']);

        }


        public getClient (id) {
            var conn = this.clients[id];
            if (conn === undefined) return false;
            if (conn.client !== undefined) return conn.client;
            conn.client = {};
            //this.importClientFunction(conn.client, conn, this.allowedF);
            this.stub.importRemoteFunction(conn.client, conn, this.allowedF);
            return conn.client;
        }

        public getConnection (id) {
            return this.clients[id];
        }




        public sendScript(request, response, prefix) {
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
            this.scriptCache += fs.readFileSync(__dirname + '/EurecaClient.js');

            response.writeHead(200);
            response.write(this.scriptCache);
            response.end();
        }


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
                socket.eureca = {};
                socket.siggg = 'A';
                
                socket.eureca.remoteAddress = socket.remoteAddress;

                _this.clients[socket.id] = socket;

                //Send EURECA contract

                _this.contract = Contract.ensureContract(_this.exports, _this.contract);

                var sendObj = {};
                sendObj[Eureca.Protocol.contractId] = _this.contract;
                socket.send(JSON.stringify(sendObj));


                _this.trigger('onConnect', socket);


                socket.onmessage(function (message) {
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
                            retObj[Eureca.Protocol.resultId = result];
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

                socket.onerror(function (e) {
                    _this.trigger('onError', e, socket);
                });


                socket.onclose(function () {
                    _this.trigger('onDisconnect', socket);
                    delete _this.clients[socket.id];
                    //console.log('i', '#of clients changed ', EURECA.clients.length, );

                });

            });

        }
        private _checkHarmonyProxies()
        {
            if (typeof Proxy == 'undefined' && !hproxywarn) {
                ELog.log('I', 'Harmony proxy not found', 'using workaround');
                ELog.log('I', 'to avoid this message please use : node --harmony-proxies <app>', '');
                hproxywarn = true;
            }
        }
        //listen(port)
        //{
        //    this._checkHarmonyProxies();

        //    this.allowedF = this.settings.allow || [];
        //    var _prefix = this.settings.prefix || 'eureca.io';
        //    //initialising server
        //    //var ioServer = io.listen(port, { path: '/' + _prefix });
        //    var ioServer = this.transport.createServer(port, { path: '/' + _prefix });

        //    var _this = this;

        //    this._handleServer(ioServer);
        //}
        //installSockJs(server, options) {
        //    var sockjs = require('sockjs');
        //    var sockjs_server = sockjs.createServer();
        //    sockjs_server.installHandlers(server, options);

        //}
        attach (server:any) {

            var app = server;
            if (server._events.request !== undefined && server.routes === undefined) app = server._events.request;

            this._checkHarmonyProxies();

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
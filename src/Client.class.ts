/// <reference path="transport/Primus.transport.ts" />
/// <reference path="Stub.ts" />
/// <reference path="EObject.class.ts" />
/// <reference path="Util.class.ts" />

/** @ignore */
declare var require: any;

/** @ignore */
declare var exports: any;

/** @ignore */
declare var eio: any;

/** @ignore */
declare var _eureca_host: any;

/** @ignore */
declare var _eureca_uri: any;


var is_nodejs = Eureca.Util.isNodejs;
if (is_nodejs) {
    var _eureca_prefix = 'eureca.io';
}

//var EurecaSocket = function (uri, options) {
//    if (is_nodejs) {
//        var sock = require('engine.io-client')(uri, options);
//        return sock;
//    } else {
//        return new eio.Socket(uri, options);
//    }
//};

module Eureca {

        /**
         * Eureca client class
         * This constructor takes an optional settings object
         * @constructor Client
         * @param {object} [settings] - have the following properties <br />
         * @property {URI} settings.uri - Eureca server WS uri, browser client can automatically guess the server URI if you are using a single Eureca server but Nodejs client need this parameter.
         * @property {string} [settings.prefix=eureca.io] - This determines the websocket path, it's unvisible to the user but if for some reason you want to rename this path use this parameter. 
         * @property {int} [settings.retry=20] - Determines max retries to reconnect to the server if the connection is lost.
         * @property {boolean} [settings.autoConnect=true] - Estabilish connection automatically after instantiation.<br />if set to False you'll need to call client.connect() explicitly.
         *          
         * 
         * @example 
         * //<h4>Example of a nodejs client</h4>
         * var Eureca = require('eureca.io');
         * var client = new Eureca.Client({ uri: 'ws://localhost:8000/', prefix: 'eureca.io', retry: 3 });
         * client.ready(function (serverProxy) {
         *    // ... 
         * });
         * 
         * @example
         * //<h4>Equivalent browser client</h4>
         * &lt;!doctype html&gt;
         * &lt;html&gt;
         *     &lt;head&gt;
         *         &lt;script src=&quot;/eureca.js&quot;&gt;&lt;/script&gt;
         *     &lt;/head&gt;
         *     &lt;body&gt;    
         *         &lt;script&gt;
         *             var client = new Eureca.Client({prefix: 'eureca.io', retry: 3 });
         *             //uri is optional in browser client
         *             client.ready(function (serverProxy) {
         *                 // ... 
         *             });
         *         &lt;/script&gt;
         *     &lt;/body&gt;
         * &lt;/html&gt;
         * 
         * @see authenticate
         * @see connect
         * @see disconnect
         * @see isReady
         * 
         * 
         */
    export class Client extends EObject {

        private _ready: boolean;


        public maxRetries: number;
        public tries: number=0;
        public prefix: string;
        public uri: string;


        /**
         * When the connection is estabilished, the server proxy object allow calling exported server functions.
         * @var {object} Client#serverProxy 
         * 
         */
        public serverProxy: any = {};

        public socket: ISocket;
        public contract: string[];
        
        private stub: Stub;
        private transport: any;        



        
        /**
        * All declared functions under this namespace become available to the server <b>if they are allowed in the server side</b>.
        * @namespace Client exports
        * @memberOf Client
        * 
        * @example
        * var client = new Eureca.Client({..});
        * client.exports.alert = function(message) {
        *       alert(message);
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

            var _this = this;
            this.exports = {};

            this.settings.autoConnect = !(this.settings.autoConnect === false);
            //if (this.settings.autoConnect !== false) 
            this.maxRetries = settings.retry || 20;
            //var tries = 0;




            this.registerEvents(['ready', 'update', 'onConnect', 'onDisconnect', 'onError', 'onMessage', 'onConnectionLost', 'onConnectionRetry', 'authResponse']);


            if (this.settings.autoConnect) this.connect();

            

        }


        /**
         * close client connection
         * 
         * 
         * @function Client#disconnect
         *    
         */
        public disconnect()
        {
            this.tries = this.maxRetries+1;
            this.socket.close();
        }


        /**
        * indicate if the client is ready or not, it's better to use client.ready() event, but if for some reason
        * you need to check if the client is ready without using the event system you can use this.<br />
        * 
         * @function Client#isReady
         * @return {boolean} - true if the client is ready   
         * 
         * @example
         * var client = new Eureca.Client({..});
         * //... 
         * if (client.isReady()) {
         *      client.serverProxy.foo();
         * }
         */
        public isReady() {
            return this._ready;
        }


        /**
         * Send authentication request to the server. <br />
         * this can take an arbitrary number of arguments depending on what you defined in the server side <br />
         * when the server receive an auth request it'll handle it and return null on auth success, or an error message if something goes wrong <br />
         * you need to listed to auth result throught authResponse event
         * ** Important ** : it's up to you to define the authenticationmethod in the server side
         * @function Client#authenticate
         *
         * @example 
         * var client = new Eureca.Client({..});
         * //listen to auth response
         * client.authResponse(function(result) {
         *     if (result == null) { 
         *         // ... Auth OK
         *     }
         *     else {
         *         // ... Auth failed
         *     }
         * });
         * 
         * client.ready(function(){
         * 
         *      //send auth request
         *      client.authenticate('your_auth_token');
         * });
         */
        public authenticate(...args: any[]) {
            if (!this._ready) 
            {
                return;
            }

            var authRequest = {};
            authRequest[Eureca.Protocol.authReq] = args;
            console.log('sending auth request', authRequest );
            this.socket.send(authRequest);
        }

        /*
         * If the authentication is used, this will tell you if you are already authenticated or not.
         * @return {boolean} true mean that the client is authenticated
         */
        public isAuthenticated():boolean {
            return this.socket.isAuthenticated();
        }

        /**
         * connect client 
         * 
         * 
         * @function Client#connect
         *    
         */
        public connect() {
            
            var _this = this;
            var prefix = '';
            prefix += this.settings.prefix || _eureca_prefix;

            var _eureca_uri = _eureca_uri || undefined;
            var uri = this.settings.uri || (prefix ? _eureca_host + '/'+ prefix : (_eureca_uri || undefined));

            console.log(uri, prefix);
            _this._ready = false;
            var _transformer = this.settings.transformer;
            var _parser = this.settings.parser;

            //_this.socket = EurecaSocket(uri, { path: prefix });
            var client = this.transport.createClient(uri, { prefix: prefix, transformer: _transformer, parser: _parser, retries: this.maxRetries, minDelay:100 });
            _this.socket = client;


            client.on('open', function () {                
                _this.trigger('onConnect', client);
                _this.tries = 0;                
            });


            client.on('message', function (data) {
                _this.trigger('onMessage', data);

                var jobj: any;

                if (typeof data != 'object') {
                    try {
                        jobj = JSON.parse(data);
                    }
                    catch (ex) {
                        jobj = {};
                    }
                }
                else {
                    jobj = data;
                }

                

                if (jobj[Eureca.Protocol.contractId]) //should be first message
                {
                    var update = _this.contract && _this.contract.length > 0;

                    _this.contract = jobj[Eureca.Protocol.contractId];
                    _this.stub.importRemoteFunction(_this.serverProxy, _this.socket, jobj[Eureca.Protocol.contractId]);


                    var next = function () {
                        _this._ready = true;
                        if (update) {

                            /**
                            * ** Experimental ** Triggered when the server explicitly notify the client about remote functions change.<br />
                            * you'll need this for example, if the server define some functions dynamically and need to make them available to clients.
                            *
                            */
                            _this.trigger('update', _this.serverProxy, _this.contract);
                        }
                        else {

                            /**
                            * Triggered when the connection is estabilished and server remote functions available to the client.
                            *
                            * @event Client#ready
                            * @property {Proxy} serverProxy - server proxy object.
                            * @example
                            * client.ready(function (serverProxy) {
                            *    serverProxy.hello();    
                            * });                           
                            * 
                            */
                            _this.trigger('ready', _this.serverProxy, _this.contract);
                        }
                    }

                    if (_this.settings.authenticate) _this.settings.authenticate(_this, next);
                    else next();

                    return;
                }
                
                //Handle auth response
                if (jobj[Eureca.Protocol.authResp] !== undefined)
                {
                    _this.socket.eureca.authenticated = true;
                    var callArgs = ['authResponse'].concat(jobj[Eureca.Protocol.authResp]);

                    _this.trigger.apply(_this, callArgs);
                    return;
                }

                // /!\ ordre is important we have to check invoke BEFORE callback
                if (jobj[Eureca.Protocol.functionId] !== undefined) //server invoking client
                {

                    var returnFunc = function (result) {
                        var retObj = {};
                        retObj[Eureca.Protocol.signatureId] = this.retId;
                        retObj[Eureca.Protocol.resultId] = result;
                        this.connection.send(JSON.stringify(retObj));
                    }

                    var context: any = { user: { clientId: _this.socket.id }, connection: _this.socket, async: false, retId: jobj[Eureca.Protocol.signatureId], 'return': returnFunc };

                    _this.stub.invoke(context, _this, jobj, _this.socket);
                    return;
                }

                if (jobj[Eureca.Protocol.signatureId] !== undefined) //invoke result
                {
                    _this.stub.doCallBack(jobj[Eureca.Protocol.signatureId], jobj[Eureca.Protocol.resultId]);
                    return;
                }
            });


            client.on('reconnecting', function (opts) {
                /**
                * triggered when the connection is lost and the client try to reconnect.
                *
                * @event Client#onConnectionRetry
                */
                _this.trigger('onConnectionRetry', opts);

            });


            client.on('close', function (e) {
                /**
                * triggered when the connection is lost after all retries to reestabilish it.
                *
                * @event Client#onDisconnect
                */
                _this.trigger('onDisconnect', client, e);
                _this.trigger('onConnectionLost');
            });

            client.on('error', function (e) {
                /**
                * triggered if an error occure.
                *
                * @event Client#onError
                * @property {String} error - the error message
                */
                _this.trigger('onError', e);
            });


        }


    }

}

if (is_nodejs) exports.Eureca = Eureca;
else var EURECA = Eureca.Client;
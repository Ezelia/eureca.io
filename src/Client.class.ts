/// <reference path="transport/Primus.transport.ts" />
/// <reference path="transport/WebRTC.transport.ts" />
/// <reference path="Stub.ts" />
/// <reference path="EObject.class.ts" />
/// <reference path="Util.class.ts" />
/// <reference path="Contract.class.ts" />

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
         * @see send
         * @see isReady
         * 
         * 
         */
    export class Client extends EObject {

        private _ready: boolean;
        private _useWebRTC: boolean;


        public maxRetries: number;
        public tries: number=0;
        public prefix: string;
        public uri: string;

        private serialize = (v) => v;
        private deserialize = (v) => v;

        /**
         * When the connection is estabilished, the server proxy object allow calling exported server functions.
         * @var {object} Client#serverProxy 
         * 
         */
        public serverProxy: any = {};
        

        public socket: ISocket;
        public contract: string[];
        
        public stub: Stub;
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

            //needed by primus
            settings.transformer = settings.transport || 'engine.io';
            this.transport = Transport.get(settings.transformer);
            
            
            if (typeof settings.serialize == 'function' || typeof this.transport.serialize == 'function')
                this.serialize = settings.serialize || this.transport.serialize;

            settings.serialize = this.serialize;

            if (typeof settings.deserialize == 'function'|| typeof this.transport.deserialize == 'function')
                this.deserialize = settings.deserialize || this.transport.deserialize
            
            settings.deserialize = this.deserialize;
            

            this.stub = new Stub(settings);

            


            
            this.exports = {};

            this.settings.autoConnect = !(this.settings.autoConnect === false);
            //if (this.settings.autoConnect !== false) 
            this.maxRetries = settings.retry || 20;
            //var tries = 0;




            //this.registerEvents(['ready', 'update', 'onConnect', 'onDisconnect', 'onError', 'onMessage', 'onConnectionLost', 'onConnectionRetry', 'authResponse']);


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
         * Send user data to the server
         * 
         * @function Client#send
         * @param {any} rawData - data to send (must be serializable type)
         */
        public send(rawData:any) {
            return this.socket.send(this.serialize(rawData));
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
            //if (!this._ready) 
            //{
            //    return;
            //}

            var authRequest = {};
            authRequest[Eureca.Protocol.authReq] = args;
            this.socket.send(this.serialize(authRequest));
        }




        /*
         * If the authentication is used, this will tell you if you are already authenticated or not.
         * @return {boolean} true mean that the client is authenticated
         */
        public isAuthenticated():boolean {
            return this.socket.isAuthenticated();
        }



        private setupWebRTC() {

            //this.stub.importRemoteFunction(_this.webRTCProxy, _this.socket, jobj[Eureca.Protocol.contractId]);
        }


        /**
         * connect client 
         * 
         * 
         * @function Client#connect
         *    
         */
        public connect() {
            
            //var _this = this;
            var prefix = '';
            prefix += this.settings.prefix || _eureca_prefix;

            var _eureca_uri = _eureca_uri || undefined;
            var uri = this.settings.uri || (prefix ? _eureca_host + '/'+ prefix : (_eureca_uri || undefined));

            console.log(uri, prefix);
            this._ready = false;
            var _transformer = this.settings.transformer;
            var _parser = this.settings.parser;

            //_this.socket = EurecaSocket(uri, { path: prefix });
            var client = this.transport.createClient(uri, {
                prefix: prefix,
                transformer: _transformer,
                parser: _parser,
                retries: this.maxRetries,
                minDelay: 100,

                //WebRTC stuff
                reliable: this.settings.reliable,
                maxRetransmits: this.settings.maxRetransmits,
                ordered: this.settings.ordered
            });
            this.socket = client;

            client._proxy = this.serverProxy;

            this._handleClient(client, this.serverProxy);

        }


        private _handleClient(client, proxy) {
            const __this = this;

            client.on('open', function () {                
                __this.trigger('connect', client);
                __this.tries = 0;
            });


            client.on('message', function (data) {
                __this.trigger('message', data);

                var jobj: any = __this.deserialize.call(client, data);

                //if (typeof data != 'object') {
                //    try {
                //        jobj = JSON.parse(data);
                //    }
                //    catch (ex) {
                //        jobj = {};
                //    }
                //}
                //else {
                //    jobj = data;
                //}

                if (typeof jobj != 'object') {
                    __this.trigger('unhandledMessage', data);
                    return;
                }


                if (jobj[Eureca.Protocol.contractId]) //should be first message
                {
                    var update = __this.contract && __this.contract.length > 0;

                    __this.contract = jobj[Eureca.Protocol.contractId];


                    /** Experimental : dynamic client contract*/
                    //if (jobj[Protocol.signatureId]) {

                    //    var contract = [];
                    //    contract = Contract.ensureContract(_this.exports);    

                    //    var contractResp = {};                    
                    //    contractResp[Protocol.contractId] = contract;
                    //    contractResp[Protocol.signatureId] = jobj[Protocol.signatureId];

                    //    _this.send(contractResp);

                    //    _this.contract = contract;
                    //}
                    /*****************************************************/


                    __this.stub.importRemoteFunction(proxy, client, jobj[Eureca.Protocol.contractId]/*, _this.serialize*/);


                    //var next = function () {
                    __this._ready = true;
                    if (update) {

                        /**
                        * ** Experimental ** Triggered when the server explicitly notify the client about remote functions change.<br />
                        * you'll need this for example, if the server define some functions dynamically and need to make them available to clients.
                        *
                        */
                        __this.trigger('update', proxy, __this.contract);
                    }
                    else {


                        __this.trigger('ready', proxy, __this.contract);
                    }
                    //}

                    //if (_this.settings.authenticate) _this.settings.authenticate(_this, next);
                    //else next();



                    return;
                }

                //Handle auth response
                if (jobj[Eureca.Protocol.authResp] !== undefined) {
                    client.eureca.authenticated = true;
                    var callArgs = ['authResponse'].concat(jobj[Eureca.Protocol.authResp]);



                    __this.trigger.apply(__this, callArgs);
                    return;
                }

                // /!\ ordre is important we have to check invoke BEFORE callback
                if (jobj[Eureca.Protocol.functionId] !== undefined) //server invoking client
                {

                    if (client.context == undefined) {

                        var returnFunc = function (result, error=null) {
                            var retObj = {};
                            retObj[Eureca.Protocol.signatureId] = this.retId;
                            retObj[Eureca.Protocol.resultId] = result;
                            retObj[Eureca.Protocol.errorId] = error;
                            this.connection.send(this.serialize(retObj));
                        }

                        client.context = { 
                            user: { clientId: client.id }, 
                            connection: client, 
                            socket: client, 
                            serverProxy: client.serverProxy, 
                            async: false, 
                            retId: jobj[Eureca.Protocol.signatureId], 
                            serialize:__this.serialize,
                            'return': returnFunc };
                    }
                    client.context.retId = jobj[Eureca.Protocol.signatureId];


                    //Experimental custom context sharing
                    //remote context is shared throught clientProxy or proxy function in the server side
                    //Example 
                    // a server exposing hello() function
                    // a client calling server hello() function
                    //
                    // in the client side you can issue : 
                    //    eurecaServer.hello.context = {somefield:'someData'}
                    //    //you can also use eurecaServer.context = {somefield:'someData'} in this case it'll be global to all exposed functions !
                    //    eurecaServer.hello();
                    //
                    // in the server side, you get the remote shared context throught
                    //    exports.hello = function() {
                    //          console.log(this.remoteContext); // <== you get the remote context here 
                    //          console.log('hello');
                    //    }
                    //if (jobj[Eureca.Protocol.context]) {
                    //    client.remoteContext = jobj[Eureca.Protocol.context];
                    //}

                    __this.stub.invoke(client.context, __this, jobj, client);
                    return;
                }

                if (jobj[Eureca.Protocol.signatureId] !== undefined) //invoke result
                {
                    //_this.stub.doCallBack(jobj[Eureca.Protocol.signatureId], jobj[Eureca.Protocol.resultId], jobj[Eureca.Protocol.errorId]);
                    Stub.doCallBack(jobj[Eureca.Protocol.signatureId], jobj[Eureca.Protocol.resultId], jobj[Eureca.Protocol.errorId]);
                    return;
                }

                __this.trigger('unhandledMessage', data);
            });


            client.on('reconnecting', function (opts) {

                __this.trigger('connectionRetry', opts);

            });


            client.on('close', function (e) {

                __this.trigger('disconnect', client, e);
                __this.trigger('connectionLost');
            });

            client.on('error', function (e) {

                __this.trigger('error', e);
            });

            client.on('stateChange', function (s) {

                __this.trigger('stateChange', s);
            });
        }

        //#region ==[ Events bindings ]===================

        /**
         * Bind a callback to 'ready' event @see {@link Client#event:ready|Client ready event}
         * >**Note :** you can also use Client.on('ready', callback) to bind ready event
         * 
         * @function Client#ready
         * 
         */
        public ready(callback: (any) => void) {
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
            this.on('ready', callback);
        }







        /**
         * Bind a callback to 'update' event @see {@link Client#event:update|Client update event}
         * >**Note :** you can also use Client.on('update', callback) to bind update event
         * 
         * @function Client#update
         * 
         */
        public update(callback: (any) => void) {
            this.on('update', callback);
        }


        /**
         * Bind a callback to 'connect' event
         * >**Note :** you can also use Client.on('connect', callback) to bind connect event
         * 
         * @function Client#onConnect
         * 
         */
        public onConnect(callback: (any) => void) {
            this.on('connect', callback);
        }


        /**
         * Bind a callback to 'disconnect' event @see {@link Client#event:disconnect|Client disconnect event}
         * >**Note :** you can also use Client.on('disconnect', callback) to bind disconnect event
         * 
         * @function Client#donDisconnect
         * 
         */
        public onDisconnect(callback: (any) => void) {


            /**
            * triggered when the connection is lost after all retries to reestabilish it.
            *
            * @event Client#disconnect
            */
            this.on('disconnect', callback);
        }


        /**
         * Bind a callback to 'message' event @see {@link Client#event:message|Client message event}
         * >**Note :** you can also use Client.on('message', callback) to bind message event
         * 
         * @function Client#onMessage
         * 
         */
        public onMessage(callback: (any) => void) {


            /**
            * Triggered when the client receive a message from the server.
            * This event can be used to intercept exchanged messages betweens client and server, if you need to access low level network messages
            * 
            * @event Client#message
            * 
            * 
            */
            this.on('message', callback);
        }



        /**
         * Bind a callback to 'unhandledMessage' event @see {@link Client#event:unhandledMessage|Client unhandledMessage event}
         * >**Note :** you can also use Client.on('message', callback) to bind unhandledMessage event
         * 
         * @function Client#onUnhandledMessage
         * 
         */
        public onUnhandledMessage(callback: (any) => void) {

            /**
            * Triggered when the client receive a message from the server and is not able to handle it.
            * this mean that the message is not an internal eureca.io message.<br />
            * if for some reason you need to exchange send/receive raw or custom data, listen to this event which in countrary to {@link Client#event:message|message event} will only trigger for non-eureca messages.
            * 
            * @event Client#unhandledMessage
            * 
            * 
            */
            this.on('unhandledMessage', callback);

        }



        /**
         * Bind a callback to 'error' event @see {@link Client#event:error|Client error event}
         * >**Note :** you can also use Client.on('error', callback) to bind error event
         * 
         * @function Client#onError
         * 
         */
        public onError(callback: (any) => void) {


            /**
            * triggered if an error occure.
            *
            * @event Client#error
            * @property {String} error - the error message
            */
            this.on('error', callback);
        }



        /**
         * Bind a callback to 'connectionLost' event 
         * >**Note :** you can also use Client.on('connectionLost', callback) to bind connectionLost event
         * 
         * @function Client#onConnectionLost
         * 
         */
        public onConnectionLost(callback: (any) => void) {
            this.on('connectionLost', callback);
        }



        /**
         * Bind a callback to 'connectionRetry' event 
         * >**Note :** you can also use Client.on('connectionRetry', callback) to bind connectionRetry event
         * 
         * @function Client#onConnectionRetry
         * 
         */
        public onConnectionRetry(callback: (any) => void) {
            /**
            * triggered when the connection is lost and the client try to reconnect.
            *
            * @event Client#connectionRetry
            */
            this.on('connectionRetry', callback);
        }



        /**
         * Bind a callback to 'authResponse' event @see {@link Client#event:authResponse|Client authResponse event}
         * >**Note :** you can also use Client.on('authResponse', callback) to bind authResponse event
         * 
         * @function Client#onAuthResponse
         * 
         */
        public onAuthResponse(callback: (any) => void) {


            /**
            * Triggered when the client receive authentication response from the server.
            * The server should return a null response on authentication success.
            * 
            * @event Client#authResponse
            * 
            * 
            */
            this.on('authResponse', callback);
        }


        //#endregion

    }

}

if (is_nodejs) exports.Eureca = Eureca;
else var EURECA = Eureca.Client;

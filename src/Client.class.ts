import { IServer } from "./IServer.interface";
import { ISocket } from "./ISocket.interface";
import { EventEmitter } from "./EventEmitter";
import { Stub } from "./Stub";

import { Transport } from "./Transport";
import { Util } from "./Util.class";
import { Contract } from "./Contract.class";
import { Protocol } from "./Protocol.static";
import { InvokeContext } from "./InvokeContext.class";

import * as Transports from './transport/index';

/** @ignore */
declare var _eureca_host: any;
declare var _eureca_uri: any;



/**
 * Eureca client class
 * This constructor takes an optional settings object
 * @constructor Client
 * @param {object} [settings] - have the following properties <br />
 * @property {uri} settings.uri - Eureca server WS uri, browser client can automatically guess the server URI if you are using a single Eureca server but Nodejs client need this parameter.
 * @property {string} [settings.prefix=eureca.io] - This determines the websocket path, it's unvisible to the user but if for some reason you want to rename this path use this parameter. 
 * @property {int} [settings.retry=20] - Determines max retries to reconnect to the server if the connection is lost.
 * @property {boolean} [settings.autoConnect=true] - Estabilish connection automatically after instantiation.<br />if set to False you'll need to call client.connect() explicitly.
 * @property {object} [settings.transportSettings] - If defined, all parameters passed here will be sent to the underlying transport settings, this can be used to finetune, or override transport settings.
 * 
 * @example 
 * **Example of a nodejs client**
 * ```javascript
 * var Eureca = require('eureca.io');
 * var client = new Eureca.Client({ uri: 'ws://localhost:8000/', prefix: 'eureca.io', retry: 3 });
 * client.ready(function (serverProxy) {
 *    // ... 
 * });
 * ```
 * 
 * @example
 * **Equivalent browser client**
 * ```html
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
 * ```
 * 
 * @see authenticate
 * @see connect
 * @see disconnect
 * @see send
 * @see isReady
 * 
 * 
 */

export class Client extends EventEmitter {
    public transport;
    public exports = {};
    public stub: Stub;
    public contract = [];

    /** @ignore */
    private __eureca_exports__: any = {};

    /** @ignore */
    //this variable keeps track of received name spaces list
    private __eureca_imports__: any = {};

    /** @ignore */
    //this variable checks if we received the initial namespaces list from the server
    private __eureca_imports_received__ = false;

    private socket: ISocket;

    private state: string;


    public serverProxy: any = {};

    /** @ignore */
    private serialize = (v) => v;
    /** @ignore */
    private deserialize = (v) => v;

    constructor(public settings: any = {}) {
        super();

        if (!settings.transport) settings.transport = 'engine.io';
        if (!settings.prefix) settings.prefix = 'eureca.io';
        if (!settings.clientScript) settings.clientScript = '/eureca.js';

        this.loadTransports();
        this.transport = Transport.get(settings.transport);

        if (this.transport.serialize) this.serialize = this.transport.serialize;
        if (this.transport.deserialize) this.deserialize = this.transport.deserialize;

        settings.serialize = settings.serialize || this.serialize;
        settings.deserialize = settings.deserialize || this.deserialize;

        settings.retries = settings.retries || 20;
        settings.autoConnect = !(settings.autoConnect === false);
        //if (this.settings.autoConnect !== false) 


        this.stub = new Stub(settings);


        if (this.settings.autoConnect)
            setTimeout(this.connect.bind(this), 100);
    }


    private loadTransports() {
        for (let tr in Transports)
            if (typeof Transports[tr].register === 'function') Transports[tr].register();
    }

    public ready(callback) {
        if (callback) {
            if (this.state === 'ready') callback();
            else this.on('ready', callback);
            return null;
        }

        return new Promise(resolve => {
            this.on('ready', resolve);
        })
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
        var authRequest = {};
        authRequest[Protocol.authReq] = args;
        this.socket.send(this.settings.serialize(authRequest));
    }

    /**
     * connect client 
     * 
     * 
     * @function Client#connect
     *    
     */
    public connect() {
        const prefix = this.settings.prefix || _eureca_prefix;
        const uri = this.settings.uri || (prefix ? _eureca_host + '/' + prefix : (_eureca_uri || undefined));
        this.state = 'connecting';

        this.socket = this.transport.createClient(uri, this.settings);
        //this.socket.proxy = this.serverProxy;

        this._handleClient(this.socket);
    }

    /**
     * close client connection
     * 
     * 
     * @function Client#disconnect
     *    
     */
    public disconnect() {
        //this.tries = this.maxRetries + 1;
        this.socket.close();
    }




    public _export(obj, name, update = true) {
        if (typeof name !== 'string') throw new Error('invalid object name');
        if (name !== '__default__' && this.__eureca_exports__[name]) {
            console.warn(`Export name "${name}" already used, will be overwritten`);
        }
        const cexport = {
            exports: obj,
            contract: Contract.ensureContract(obj),
            context: undefined
        }
        this.__eureca_exports__[name] = cexport;

        if (update) {
            const sendObj = {};
            sendObj[Protocol.contractFnList] = cexport.contract;
            sendObj[Protocol.contractObjId] = name;

            this.socket.send(this.settings.serialize(sendObj));
        }
    }

    public import(name: string = '__default__') {
        return this.socket.import(name);
    }

    private _handleClient(clientSocket: ISocket) {

        const proxy = clientSocket.proxy;

        clientSocket.on('open', () => this.emit('connect', clientSocket));


        clientSocket.on('message', (data) => {
            this.emit('message', data);

            const jobj: any = this.deserialize.call(clientSocket, data);

            if (typeof jobj != 'object') {
                this.emit('unhandledMessage', data);
                return;
            }


            if (jobj[Protocol.contractFnList]) {
                const update = this.contract && this.contract.length > 0;

                this.contract = jobj[Protocol.contractFnList];


                /** dynamic client contract*/
                if (jobj[Protocol.command]) {
                    this._export(this.exports, '__default__', false);

                    for (let name in this.__eureca_exports__) {
                        const cexport = this.__eureca_exports__[name];
                        const sendObj = {};
                        sendObj[Protocol.contractFnList] = cexport.contract;
                        sendObj[Protocol.contractObjId] = name;

                        clientSocket.send(this.settings.serialize(sendObj));
                    }

                    //this.contract = contract;
                }
                /*****************************************************/


                const importName = jobj[Protocol.contractObjId] ? jobj[Protocol.contractObjId] : '__default__';
                this.stub.importRemoteFunction(clientSocket, jobj[Protocol.contractFnList], importName);


                this.serverProxy = this.socket.proxy || {};

                //var next = function () {


                this.__eureca_imports__[importName] = true;

                if (jobj[Protocol.nsListId]) {
                    this.__eureca_imports_received__ = true;
                    for (let ns of jobj[Protocol.nsListId]) {
                        if (!this.__eureca_imports__[ns]) this.__eureca_imports__[ns] = false;
                    }
                }


                if (this.state === 'ready' && update) {

                    /**
                    * ** Experimental ** Triggered when the server explicitly notify the client about remote functions change.<br />
                    * you'll need this for example, if the server define some functions dynamically and need to make them available to clients.
                    *
                    */
                    this.emit('update', this.serverProxy, this.contract);
                }
                else {
                    const allNS = this.__eureca_imports_received__ && [...Object.values(this.__eureca_imports__)].reduce((cumul, v) => cumul && v);

                    if (allNS) {
                        this.state = 'ready';
                        this.emit('ready', this.serverProxy, this.contract);
                    }

                }

                return;
            }

            //Handle auth response
            if (jobj[Protocol.authResp] !== undefined) {
                clientSocket.eureca.authenticated = true;
                var callArgs = ['authResponse'].concat(jobj[Protocol.authResp]);
                this.emit.apply(this, callArgs);
                return;
            }

            // /!\ order is important we have to check invoke BEFORE callback
            if (jobj[Protocol.functionId] !== undefined) //server invoking client
            {

                if (clientSocket.context == undefined) {
                    clientSocket.context = new InvokeContext(clientSocket, jobj);
                    clientSocket.context.serialize = this.serialize;
                }

                //update the return id;
                clientSocket.context.retId = jobj[Protocol.signatureId];
                clientSocket.context.message = jobj;


                const handle = jobj[Protocol.contractObjId] ? this.__eureca_exports__[jobj[Protocol.contractObjId]] : this;

                this.stub.invokeLocal(clientSocket.context, handle);
                return;
            }

            if (jobj[Protocol.signatureId] !== undefined) //invoke result
            {
                //_this.stub.doCallBack(jobj[Protocol.signatureId], jobj[Protocol.resultId], jobj[Protocol.errorId]);
                Stub.doCallBack(jobj[Protocol.signatureId], jobj[Protocol.resultId], jobj[Protocol.errorId]);
                return;
            }

            this.emit('unhandledMessage', data);
        });


        clientSocket.on('reconnecting', (opts) => this.emit('connectionRetry', opts));


        clientSocket.on('close', (e) => {
            this.emit('disconnect', clientSocket, e);
            this.emit('connectionLost');
        });

        clientSocket.on('error', (e) => this.emit('error', e));

        clientSocket.on('stateChange', (s) => this.emit('stateChange', s));

    }




    //#region ==[ Deprecated Events bindings ]===================

    /**
     * Bind a callback to 'update' event @see {@link Client#event:update|Client update event}
     * >**Note :** you can also use Client.on('update', callback) to bind update event
     * 
     * @function Client#update
     * 
     */
    public update(callback: (any) => void) {
        console.warn("Deprecated, please use client.on('update', callback) instead");
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

export { version } from './version'

var is_nodejs = Util.isNodejs;
if (is_nodejs) {
    var _eureca_prefix = 'eureca.io';
}


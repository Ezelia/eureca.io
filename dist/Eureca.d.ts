declare class EventEmitter {
    _events: any;
    _eventsCount: number;
    /**
     * Minimal `EventEmitter` interface that is molded against the Node.js
     * `EventEmitter` interface.
     *
     * @constructor
     * @public
     */
    constructor();
    /**
     * Return an array listing the events for which the emitter has registered
     * listeners.
     *
     * @returns {Array}
     * @public
     */
    eventNames(): any[];
    /**
     * Return the listeners registered for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @returns {Array} The registered listeners.
     * @public
     */
    listeners(event: any): any[];
    /**
     * Return the number of listeners listening to a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @returns {Number} The number of listeners.
     * @public
     */
    listenerCount(event: any): any;
    /**
     * Calls each of the listeners registered for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @returns {Boolean} `true` if the event had listeners, else `false`.
     * @public
     */
    emit(event: any, a1?: any, a2?: any, a3?: any, a4?: any, a5?: any): boolean;
    /**
     * Add a listener for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn The listener function.
     * @param {*} [context=this] The context to invoke the listener with.
     * @returns {EventEmitter} `this`.
     * @public
     */
    on(event: any, fn: any, context?: any): any;
    /**
     * Add a one-time listener for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn The listener function.
     * @param {*} [context=this] The context to invoke the listener with.
     * @returns {EventEmitter} `this`.
     * @public
     */
    once(event: any, fn: any, context: any): any;
    /**
     * Remove the listeners of a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn Only remove the listeners that match this function.
     * @param {*} context Only remove the listeners that have this context.
     * @param {Boolean} once Only remove one-time listeners.
     * @returns {EventEmitter} `this`.
     * @public
     */
    removeListener(event: any, fn: any, context: any, once: any): this;
    /**
     * Remove all listeners, or those of the specified event.
     *
     * @param {(String|Symbol)} [event] The event name.
     * @returns {EventEmitter} `this`.
     * @public
     */
    removeAllListeners(event: any): this;
}

/** @ignore */
declare class EurecaPromise<T> extends Promise<T> {
    sig: string;
    resolve: any;
    reject: any;
    constructor(executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void);
    onReady(onfullfilled: any, onrejected: any): Promise<T>;
}

/**
 * Represents a client socket in the server side <br />
 * When a new client is connected, a socket is instantiated in the server side allowing the server to exchange data with that client <br />
 * In most use cases you don't need to handle this socket directly <br />
 * but if you want to implement your own protocole on top of eureca.io you can use this interface to handle raw data.<br />
 *
 * @interface ISocket
 *
 *
 * @example
 * // <h3>Server side</h3>
 * var server = new Eureca.Server();
 * server.on('connect', function(socket) {
 *      socket.send('my raw data');
 * });
 *
 * <br />
 *
 * @example
 * // <h3>Client side</h3>
 *
 * var client = new Eureca.Client();
 *
 * // See <b>@[ {@link Client#event:unhandledMessage|unhandledMessage event} ]</b>
 *
 * client.on('unhandledMessage', function (data) {
 *    console.log(data); // prints : "my raw data"
 * });
 *
 *
 */
interface ISocket {
    id: any;
    eureca: any;
    proxy: any;
    contract: any;
    context: any;
    /**
     * Send user data to the client bound to this socket
     *
     * @function ISocket#send
     * @param {any} rawData - data to send (must be serializable type)
     */
    send(data: any): any;
    close(): any;
    isAuthenticated(): boolean;
    send(data: any): any;
    close(): any;
    on(evt: string, callback: (...args: any[]) => any, context?: any): any;
    import(name: string): any;
}

/** @ignore */
declare class InvokeContext {
    socket: ISocket;
    message: any;
    async: boolean;
    proxy: any;
    user: any;
    serialize: any;
    __erctx__: any;
    retId: any;
    constructor(socket: ISocket, message: any);
    return(result: any, error?: any): void;
    sendResult(result: any, error: any, errorcode?: number): void;
}

/** @ignore */
declare class Stub {
    settings: any;
    private static callbacks;
    constructor(settings?: any);
    static registerCallBack(sig: any, cb: any): void;
    static doCallBack(sig: any, result: any, error: any, socket?: ISocket): void;
    invokeRemote(fname: string, importName: string, socket: ISocket, ...args: any[]): EurecaPromise<unknown>;
    /**
     * Generate proxy functions allowing to call remote functions
     */
    importRemoteFunction(socket: ISocket, functions: any, importName: string, filterRx?: RegExp): void;
    invokeLocal(invokeContext: InvokeContext, handle: any): void;
}

declare const version = "0.9.0";

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
declare class Client extends EventEmitter {
    settings: any;
    transport: any;
    exports: {};
    stub: Stub;
    contract: any[];
    /** @ignore */
    private __eureca_exports__;
    /** @ignore */
    private __eureca_imports__;
    /** @ignore */
    private __eureca_imports_received__;
    private socket;
    private state;
    serverProxy: any;
    /** @ignore */
    private serialize;
    /** @ignore */
    private deserialize;
    constructor(settings?: any);
    private loadTransports;
    ready(callback: any): Promise<unknown>;
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
    authenticate(...args: any[]): void;
    /**
     * connect client
     *
     *
     * @function Client#connect
     *
     */
    connect(): void;
    /**
     * close client connection
     *
     *
     * @function Client#disconnect
     *
     */
    disconnect(): void;
    _export(obj: any, name: any, update?: boolean): void;
    import(name?: string): any;
    private _handleClient;
    /**
     * Bind a callback to 'update' event @see {@link Client#event:update|Client update event}
     * >**Note :** you can also use Client.on('update', callback) to bind update event
     *
     * @function Client#update
     *
     */
    update(callback: (any: any) => void): void;
    /**
     * Bind a callback to 'connect' event
     * >**Note :** you can also use Client.on('connect', callback) to bind connect event
     *
     * @function Client#onConnect
     *
     */
    onConnect(callback: (any: any) => void): void;
    /**
     * Bind a callback to 'disconnect' event @see {@link Client#event:disconnect|Client disconnect event}
     * >**Note :** you can also use Client.on('disconnect', callback) to bind disconnect event
     *
     * @function Client#donDisconnect
     *
     */
    onDisconnect(callback: (any: any) => void): void;
    /**
     * Bind a callback to 'message' event @see {@link Client#event:message|Client message event}
     * >**Note :** you can also use Client.on('message', callback) to bind message event
     *
     * @function Client#onMessage
     *
     */
    onMessage(callback: (any: any) => void): void;
    /**
     * Bind a callback to 'unhandledMessage' event @see {@link Client#event:unhandledMessage|Client unhandledMessage event}
     * >**Note :** you can also use Client.on('message', callback) to bind unhandledMessage event
     *
     * @function Client#onUnhandledMessage
     *
     */
    onUnhandledMessage(callback: (any: any) => void): void;
    /**
     * Bind a callback to 'error' event @see {@link Client#event:error|Client error event}
     * >**Note :** you can also use Client.on('error', callback) to bind error event
     *
     * @function Client#onError
     *
     */
    onError(callback: (any: any) => void): void;
    /**
     * Bind a callback to 'connectionLost' event
     * >**Note :** you can also use Client.on('connectionLost', callback) to bind connectionLost event
     *
     * @function Client#onConnectionLost
     *
     */
    onConnectionLost(callback: (any: any) => void): void;
    /**
     * Bind a callback to 'connectionRetry' event
     * >**Note :** you can also use Client.on('connectionRetry', callback) to bind connectionRetry event
     *
     * @function Client#onConnectionRetry
     *
     */
    onConnectionRetry(callback: (any: any) => void): void;
    /**
     * Bind a callback to 'authResponse' event @see {@link Client#event:authResponse|Client authResponse event}
     * >**Note :** you can also use Client.on('authResponse', callback) to bind authResponse event
     *
     * @function Client#onAuthResponse
     *
     */
    onAuthResponse(callback: (any: any) => void): void;
}

/**
 * Eureca server constructor
 * This constructor takes an optional settings object
 * @constructor Server
 * @param {object} [settings] - have the following properties
 * @property {string} [settings.transport=engine.io] - can be "engine.io", "sockjs", "websockets", "faye" or "browserchannel" by default "engine.io" is used
 * @property {function} [settings.authenticate] - If this function is defined, the client will not be able to invoke server functions until it successfully call the client side authenticate method, which will invoke this function.
 * @property {function} [settings.serialize] - If defined, this function is used to serialize the request object before sending it to the client (default is JSON.stringify). This function can be useful to add custom information/meta-data to the transmitted request.
 * @property {function} [settings.deserialize] - If defined, this function is used to deserialize the received response string.
 * @property {function} [settings.cookieParser] - If defined, middleweare will be used to parse cookies (to use with express cookieParser).
 * @property {object} [settings.transportSettings] - If defined, all parameters passed here will be sent to the underlying transport settings, this can be used to finetune, or override transport settings.
 *

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
declare class Server extends EventEmitter {
    settings: any;
    transport: any;
    exports: {};
    stub: Stub;
    contract: any[];
    clients: {};
    private appServer;
    private __eureca_exports__;
    private __eureca_rest__;
    private scriptCache;
    private useAuthentication;
    /**
     * Allowed regular expression is used to check the validity of a function received from client
     */
    private allowedRx;
    private allowedF;
    private ioServer;
    private serialize;
    private deserialize;
    constructor(settings?: any);
    private loadTransports;
    private sendScript;
    private _export;
    private _handleEurecaClientSocketEvents;
    private _handleServer;
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
    getClient(id: any): any;
    /**
     * returns the client socket
     * @param id connection id
     */
    getClientSocket(id: any): any;
    getConnection(id: any): any;
    /**
     * Sends exported server functions to all connected clients <br />
     *
     * @function bind
     * @memberof Server#
     * @param {appServer} - a nodejs {@link https://nodejs.org/api/http.html#http_class_http_server|nodejs http server}
     *  or {@link http://expressjs.com/api.html#application|expressjs Application}
     *
     */
    bind(httpServer: any): void;
    attach(appServer: any): void;
    getify(fnList?: any): void;
    onConnect(callback: (any: any) => void): void;
    onDisconnect(callback: (any: any) => void): void;
    onMessage(callback: (any: any) => void): void;
    onError(callback: (any: any) => void): void;
}

interface IServer {
    onconnect(callback: (socket: ISocket) => void): any;
}

declare class Transport {
    static _transports: any;
    static register(name: string, clientScript: string, createClient: (uri: string, options?: any) => ISocket, createServer: (hook: any, options?: any) => IServer, defaultSerializer?: (data: any) => any, defaultDeserializer?: (data: any) => any): boolean;
    static get(name: any): any;
}

declare class Protocol {
    static contractFnList: string;
    static nsListId: string;
    static contractObjId: string;
    static command: string;
    static authReq: string;
    static authResp: string;
    static signal: string;
    static signalACK: string;
    static functionId: string;
    static argsId: string;
    static resultId: string;
    static errorId: string;
    static signatureId: string;
    static context: string;
}

export { Client, Protocol, Server, Transport, version };

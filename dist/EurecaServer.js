'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs');
var http$1 = require('http');
var url = require('url');

//const EventEmitter = require('eventemitter3'); //EventEmitter3 is provided by primus.io but can also be used as a standalone library
var has = Object.prototype.hasOwnProperty;
var prefix = '~';
/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @private
 */
function Events() { }
//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
    Events.prototype = Object.create(null);
    //
    // This hack is needed because the `__proto__` property is still inherited in
    // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
    //
    if (!new Events().__proto__)
        prefix = false;
}
/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
function EE(fn, context, once) {
    this.fn = fn;
    this.context = context;
    this.once = once || false;
}
/**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */
function addListener(emitter, event, fn, context, once) {
    if (typeof fn !== 'function') {
        throw new TypeError('The listener must be a function');
    }
    var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
    if (!emitter._events[evt])
        emitter._events[evt] = listener, emitter._eventsCount++;
    else if (!emitter._events[evt].fn)
        emitter._events[evt].push(listener);
    else
        emitter._events[evt] = [emitter._events[evt], listener];
    return emitter;
}
/**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */
function clearEvent(emitter, evt) {
    if (--emitter._eventsCount === 0)
        emitter._events = new Events();
    else
        delete emitter._events[evt];
}
class EventEmitter {
    /**
     * Minimal `EventEmitter` interface that is molded against the Node.js
     * `EventEmitter` interface.
     *
     * @constructor
     * @public
     */
    constructor() {
        this._events = new Events();
        this._eventsCount = 0;
        this._events = new Events();
        this._eventsCount = 0;
    }
    /**
     * Return an array listing the events for which the emitter has registered
     * listeners.
     *
     * @returns {Array}
     * @public
     */
    eventNames() {
        var names = [], events, name;
        if (this._eventsCount === 0)
            return names;
        for (name in (events = this._events)) {
            if (has.call(events, name))
                names.push(prefix ? name.slice(1) : name);
        }
        if (Object.getOwnPropertySymbols) {
            return names.concat(Object.getOwnPropertySymbols(events));
        }
        return names;
    }
    ;
    /**
     * Return the listeners registered for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @returns {Array} The registered listeners.
     * @public
     */
    listeners(event) {
        var evt = prefix ? prefix + event : event, handlers = this._events[evt];
        if (!handlers)
            return [];
        if (handlers.fn)
            return [handlers.fn];
        for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
            ee[i] = handlers[i].fn;
        }
        return ee;
    }
    ;
    /**
     * Return the number of listeners listening to a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @returns {Number} The number of listeners.
     * @public
     */
    listenerCount(event) {
        var evt = prefix ? prefix + event : event, listeners = this._events[evt];
        if (!listeners)
            return 0;
        if (listeners.fn)
            return 1;
        return listeners.length;
    }
    ;
    /**
     * Calls each of the listeners registered for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @returns {Boolean} `true` if the event had listeners, else `false`.
     * @public
     */
    emit(event, a1, a2, a3, a4, a5) {
        var evt = prefix ? prefix + event : event;
        if (!this._events[evt])
            return false;
        var listeners = this._events[evt], len = arguments.length, args, i;
        if (listeners.fn) {
            if (listeners.once)
                this.removeListener(event, listeners.fn, undefined, true);
            switch (len) {
                case 1: return listeners.fn.call(listeners.context), true;
                case 2: return listeners.fn.call(listeners.context, a1), true;
                case 3: return listeners.fn.call(listeners.context, a1, a2), true;
                case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
                case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
                case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
            }
            for (i = 1, args = new Array(len - 1); i < len; i++) {
                args[i - 1] = arguments[i];
            }
            listeners.fn.apply(listeners.context, args);
        }
        else {
            var length = listeners.length, j;
            for (i = 0; i < length; i++) {
                if (listeners[i].once)
                    this.removeListener(event, listeners[i].fn, undefined, true);
                switch (len) {
                    case 1:
                        listeners[i].fn.call(listeners[i].context);
                        break;
                    case 2:
                        listeners[i].fn.call(listeners[i].context, a1);
                        break;
                    case 3:
                        listeners[i].fn.call(listeners[i].context, a1, a2);
                        break;
                    case 4:
                        listeners[i].fn.call(listeners[i].context, a1, a2, a3);
                        break;
                    default:
                        if (!args)
                            for (j = 1, args = new Array(len - 1); j < len; j++) {
                                args[j - 1] = arguments[j];
                            }
                        listeners[i].fn.apply(listeners[i].context, args);
                }
            }
        }
        return true;
    }
    ;
    /**
     * Add a listener for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn The listener function.
     * @param {*} [context=this] The context to invoke the listener with.
     * @returns {EventEmitter} `this`.
     * @public
     */
    on(event, fn, context) {
        return addListener(this, event, fn, context, false);
    }
    ;
    /**
     * Add a one-time listener for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn The listener function.
     * @param {*} [context=this] The context to invoke the listener with.
     * @returns {EventEmitter} `this`.
     * @public
     */
    once(event, fn, context) {
        return addListener(this, event, fn, context, true);
    }
    ;
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
    removeListener(event, fn, context, once) {
        var evt = prefix ? prefix + event : event;
        if (!this._events[evt])
            return this;
        if (!fn) {
            clearEvent(this, evt);
            return this;
        }
        var listeners = this._events[evt];
        if (listeners.fn) {
            if (listeners.fn === fn &&
                (!once || listeners.once) &&
                (!context || listeners.context === context)) {
                clearEvent(this, evt);
            }
        }
        else {
            for (var i = 0, events = [], length = listeners.length; i < length; i++) {
                if (listeners[i].fn !== fn ||
                    (once && !listeners[i].once) ||
                    (context && listeners[i].context !== context)) {
                    events.push(listeners[i]);
                }
            }
            //
            // Reset the array, or remove it completely if we have no more listeners.
            //
            if (events.length)
                this._events[evt] = events.length === 1 ? events[0] : events;
            else
                clearEvent(this, evt);
        }
        return this;
    }
    ;
    /**
     * Remove all listeners, or those of the specified event.
     *
     * @param {(String|Symbol)} [event] The event name.
     * @returns {EventEmitter} `this`.
     * @public
     */
    removeAllListeners(event) {
        var evt;
        if (event) {
            evt = prefix ? prefix + event : event;
            if (this._events[evt])
                clearEvent(this, evt);
        }
        else {
            this._events = new Events();
            this._eventsCount = 0;
        }
        return this;
    }
    ;
}
//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;
//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;
//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

/** @ignore */
class EurecaPromise extends Promise {
    constructor(executor) {
        super(executor);
        //public status=0;
        //public result:any = null;
        //public error: any = null;
        this.sig = null;
        this.resolve = null;
        this.reject = null;
    }
    //cancel the operation
    onReady(onfullfilled, onrejected) {
        console.warn('onReady() is deprecated, please use then() instead');
        return this.then(onfullfilled, onrejected);
    }
}

/**@ignore */
class Util {
    static randomID() {
        return Date.now().toString(36) + Math.random().toString(36);
    }
    static getUrl(req) {
        var scheme = req.headers.referer !== undefined ? req.headers.referer.split(':')[0] : 'http';
        return scheme + '://' + req.headers.host;
    }
    static str2RegExp(input) {
        let regExp;
        let rxText = input.trim();
        let match = rxText.match(new RegExp('^/(.*?)/([gimy]*)$'));
        if (!match || match[1])
            rxText = `/${rxText.replace(/\./g, '\.').replace(/\*/g, '.*')}/`;
        match = rxText.match(new RegExp('^/(.*?)/([gimy]*)$'));
        if (match)
            regExp = new RegExp(match[1], match[2]);
        return regExp;
    }
}
Util.isNodejs = (typeof process !== 'undefined' && process.versions && process.versions.node);

class Protocol {
}
//internal stuff
Protocol.contractFnList = '__ctFnList__';
Protocol.nsListId = '__ctNSList__';
Protocol.contractObjId = '__ctObjId__';
Protocol.command = '__cmd__';
Protocol.authReq = '__auth__';
Protocol.authResp = '__authr__';
Protocol.signal = '__signal__';
Protocol.signalACK = '__sigack__';
//RPC stuff
Protocol.functionId = 'f';
Protocol.argsId = 'a';
Protocol.resultId = 'r';
Protocol.errorId = 'e';
Protocol.signatureId = 's';
Protocol.context = 'c';

/** @ignore */
class Stub {
    // Constructor
    constructor(settings = {}) {
        this.settings = settings;
    }
    static registerCallBack(sig, cb) {
        this.callbacks[sig] = cb;
    }
    static doCallBack(sig, result, error, socket) {
        if (!sig)
            return;
        var proxyObj = this.callbacks[sig];
        delete this.callbacks[sig];
        if (proxyObj !== undefined) {
            proxyObj.status = 1;
            //proxyObj.result = result;
            //proxyObj.error = error;
            if (error == null)
                proxyObj.resolve(result);
            else
                proxyObj.reject(socket ? `clientId<${socket.id}> : ${error}` : error);
        }
    }
    invokeRemote(fname, importName, socket, ...args) {
        let defResolve;
        let defReject;
        const RPCPromise = new EurecaPromise((resolve, reject) => {
            //save our resolve/reject to external variables
            defResolve = resolve;
            defReject = reject;
        });
        //save the defered resolve/reject to RPCPromise object 
        //in order to be able to resolve the promise outside the present context
        RPCPromise.resolve = defResolve;
        RPCPromise.reject = defReject;
        RPCPromise.sig = `${Util.randomID()}`;
        Stub.registerCallBack(RPCPromise.sig, RPCPromise);
        //create the RPC object
        const RPCObject = {};
        RPCObject[Protocol.functionId] = fname;
        RPCObject[Protocol.signatureId] = RPCPromise.sig;
        if (importName)
            RPCObject[Protocol.contractObjId] = importName;
        if (args.length > 0)
            RPCObject[Protocol.argsId] = args;
        socket.send(this.settings.serialize(RPCObject));
        return RPCPromise;
    }
    /**
     * Generate proxy functions allowing to call remote functions
     */
    importRemoteFunction(socket, functions, importName, filterRx) {
        if (!socket.proxy)
            socket.proxy = {};
        if (functions === undefined)
            return;
        if (!Array.isArray(functions))
            return;
        for (let fname of functions) {
            if (filterRx && !filterRx.test(fname))
                continue;
            let proxy = socket.proxy;
            if (importName && importName !== '__default__') {
                proxy[importName] = proxy[importName] || {};
                proxy = proxy[importName];
            }
            /* namespace parsing */
            let ftokens = fname.split('.');
            for (let i = 0; i < ftokens.length - 1; i++) {
                const nsToken = ftokens[i];
                proxy[nsToken] = proxy[nsToken] || {};
                proxy = proxy[nsToken];
            }
            const _fname = ftokens[ftokens.length - 1];
            /* end namespace parsing */
            //FIXME : do we need to re generate proxy function if it's already declared ?
            proxy[_fname] = (...args) => {
                return this.invokeRemote(fname, importName, socket, ...args);
            };
        }
    }
    //invoke exported function and send back the result to the invoker
    invokeLocal(invokeContext, handle) {
        const obj = invokeContext.message;
        const fId = parseInt(obj[Protocol.functionId]);
        const fname = isNaN(fId) ? obj[Protocol.functionId] : handle.contract[fId];
        /* browing namespace */
        const ftokens = fname.split('.');
        let func = handle.exports;
        for (let i = 0; i < ftokens.length; i++) {
            if (!func) {
                console.warn('Invoke error', obj[Protocol.functionId] + ' is not a function', '');
                invokeContext.sendResult(null, 'Invoke error : function ' + obj[Protocol.functionId] + ' not implemented', 501);
                return;
            }
            func = func[ftokens[i]];
        }
        /* ***************** */
        //var func = this.exports[fname];
        if (typeof func != 'function') {
            //socket.send('Invoke error');
            console.log('Invoke error', obj[Protocol.functionId] + ' is not a function', '');
            invokeContext.sendResult(null, 'Invoke error : function ' + obj[Protocol.functionId] + ' not implemented', 501);
            return;
        }
        //obj.a.push(conn); //add connection object to arguments
        try {
            obj[Protocol.argsId] = obj[Protocol.argsId] || [];
            const callCtx = handle.context || invokeContext;
            const result = func.apply(callCtx, obj[Protocol.argsId]);
            //Handle promises
            if (result instanceof Promise) {
                result
                    .then(result => invokeContext.sendResult(result, null, 200))
                    .catch(err => invokeContext.sendResult(null, err, 500));
                return;
            }
            //console.log('sending back result ', result, obj)
            if (obj[Protocol.signatureId] && !invokeContext.async) {
                invokeContext.sendResult(result, null, 200);
            }
            obj[Protocol.argsId].unshift(invokeContext.socket);
            if (typeof func.onCall == 'function')
                func.onCall.apply(invokeContext, obj[Protocol.argsId]);
        }
        catch (ex) {
            console.log('EURECA Invoke exception!! ', ex.stack);
        }
    }
}
Stub.callbacks = {};

class Transport {
    static register(name, clientScript, createClient, createServer, defaultSerializer, defaultDeserializer) {
        if (Transport._transports[name] !== undefined)
            return false;
        Transport._transports[name] = {
            createClient: createClient,
            createServer: createServer,
            script: clientScript,
            serialize: defaultSerializer,
            deserialize: defaultDeserializer
        };
        return true;
    }
    static get(name) {
        if (!Transport._transports[name])
            throw new Error('Unknown transport ' + name);
        return Transport._transports[name];
    }
}
Transport._transports = {};

/** @ignore */
class Contract {
    // Constructor
    constructor() { }
    static parseNS(target, ns = [], parent = '') {
        for (let prop in target) {
            //console.log('parsing prop', parent+prop, typeof target[prop]);
            if (typeof target[prop] == 'function') {
                ns.push(parent + prop);
            }
            else {
                //FIXME : will crash if sub NS has no children : example : exports.id = 'hello'
                Contract.parseNS(target[prop], ns, parent + prop + '.');
            }
            //contract.push(prop);
        }
        //handle instances
        if (target && target.constructor && target.constructor.name !== 'Object') {
            const proto = Object.getPrototypeOf(target);
            const props = Object.getOwnPropertyNames(proto)
                .filter(p => p !== 'constructor');
            for (let prop of props) {
                //console.log('parsing prop', parent+prop, typeof target[prop]);
                if (typeof proto[prop] == 'function') {
                    ns.push(parent + prop);
                }
                else {
                    //FIXME : will crash if sub NS has no children : example : exports.id = 'hello'
                    Contract.parseNS(proto[prop], ns, parent + prop + '.');
                }
                //contract.push(prop);
            }
        }
        return ns;
    }
    static ensureContract(target) {
        // if (typeof Proxy == 'function') //detected JS Proxy, we can set up dynamic handling of exports 
        // {
        // }
        var contract = this.parseNS(target);
        return contract;
    }
}

/** @ignore */
class InvokeContext {
    constructor(socket, message) {
        this.socket = socket;
        this.message = message;
        this.async = false;
        this.user = { clientId: socket.id };
        this.proxy = socket.proxy;
        this.retId = message[Protocol.signatureId];
        this.__erctx__ = this;
    }
    return(result, error = null) {
        var retObj = {};
        retObj[Protocol.signatureId] = this.retId;
        retObj[Protocol.resultId] = result;
        retObj[Protocol.errorId] = error;
        this.socket.send(this.serialize(retObj));
    }
    sendResult(result, error, errorcode = 0) {
        if (!this.socket)
            return;
        const retObj = {};
        retObj[Protocol.signatureId] = this.retId;
        retObj[Protocol.resultId] = result;
        retObj[Protocol.errorId] = error;
        this.socket.send(this.serialize(retObj));
    }
}

class Socket extends EventEmitter {
    constructor(tSocket) {
        super();
        this.tSocket = tSocket;
        this.eureca = { remoteAddress: { ip: undefined, port: undefined, secure: undefined }, origin: undefined };
        //socket is instanceof Primus if we are creating a client socket on the server side
        if (!tSocket.url) {
            this.request = tSocket.request;
            this.id = tSocket.id;
            this.eureca.remoteAddress = undefined;
        }
        else {
            this.eureca.origin = tSocket.url ? tSocket.url.origin : undefined;
        }
        this.bindEvents();
    }
    import(name = '__default__') {
        if (this.proxy)
            return this.proxy[name];
        return undefined;
    }
    bindEvents() {
        // //
        // if (this.tSocket instanceof Primus) {
        //     this.tSocket.on('open', () => {
        //         this.request = this.tSocket.socket.request;
        //         this.id = this.tSocket.socket.id;
        //         this.remoteAddress = this.tSocket.socket.remoteAddress;
        //     });
        // }
        //translate primus events to eureca events
        this.tSocket.on('open', (...args) => this.emit('open', ...args));
        this.tSocket.on('data', (...args) => this.emit('message', ...args));
        this.tSocket.on('end', (...args) => this.emit('close', ...args));
        this.tSocket.on('error', (...args) => this.emit('error', ...args));
        this.tSocket.on('reconnecting', (...args) => this.emit('reconnecting', ...args));
    }
    isAuthenticated() {
        return this.eureca.authenticated;
    }
    send(data) {
        this.tSocket.write(data);
    }
    close() {
        if (this.tSocket.end)
            this.tSocket.end();
        else
            this.tSocket.close();
    }
}

if (Util.isNodejs) {
    //if we are in a nodejs context, override the global variable "Primus"
    var PrimusNode = require('primus');
}
class Client {
    static create(uri, settings = {}) {
        const primusSettings = Object.assign({ pathname: settings.prefix, transformer: settings.transport }, settings.transportSettings);
        var pSocket;
        if (Util.isNodejs) {
            var CSocket = PrimusNode.createSocket(primusSettings);
            pSocket = new CSocket(uri);
        }
        else {
            pSocket = new Primus(uri, primusSettings);
        }
        return new Socket(pSocket);
    }
}

if (Util.isNodejs) {
    var PrimusNode$1 = require('primus');
}
class Server {
    constructor(primus) {
        this.primus = primus;
    }
    //on client connect
    onconnect(callback) {
        this.primus.on('connection', function (psocket) {
            //encapsulate Primus socket into eureca socket object
            const socket = new Socket(psocket);
            //Eureca.Util.extend(iosocket, socket);
            callback(socket);
        });
    }
    static create(hook, settings = {}) {
        const primusSettings = Object.assign({ pathname: settings.prefix, transformer: settings.transport }, settings.transportSettings);
        try {
            var primus = new PrimusNode$1(hook, primusSettings);
            var primusTransport = Transport.get(settings.transport);
            //populate the client script
            primusTransport.script = primus.library();
            var server = new Server(primus);
            if (settings.cookies)
                primus.use('cookies', settings.cookies);
            if (settings.session)
                primus.use('session', settings.session);
            return server;
        }
        catch (ex) {
            if (ex.name == 'PrimusError' && ex.message.indexOf('Missing dependencies') == 0) {
                console.error('Missing ', primusSettings.transformer);
                process.exit();
            }
            else {
                throw ex;
            }
        }
    }
}

function register() {
    //set empty client script by default, it'll be populated by createServer function
    Transport.register('engine.io', '', Client.create, Server.create);
    Transport.register('ws', '', Client.create, Server.create);
    Transport.register('sockjs', '', Client.create, Server.create);
    Transport.register('faye', '', Client.create, Server.create);
    Transport.register('uws', '', Client.create, Server.create);
    Transport.register('websockets', '', Client.create, Server.create);
    Transport.register('browserchannel', '', Client.create, Server.create);
}

var index = /*#__PURE__*/Object.freeze({
    __proto__: null,
    register: register
});

class Socket$1 extends EventEmitter {
    constructor(tSocket, peer) {
        super();
        this.tSocket = tSocket;
        this.peer = peer;
        this.eureca = { remoteAddress: { ip: undefined, port: undefined, secure: undefined }, origin: undefined };
        if (peer)
            peer.tSocket = this;
        this.id = peer && peer.id ? peer.id : Util.randomID();
        if (tSocket && tSocket.request)
            this.request = tSocket.request;
        this.bindEvents();
    }
    import(name = '__default__') {
        if (this.proxy)
            return this.proxy[name];
        return undefined;
    }
    update(socket) {
        if (this.tSocket != null) {
            this.tSocket.onopen = null;
            this.tSocket.onmessage = null;
            this.tSocket.onclose = null;
            this.tSocket.onerror = null;
        }
        this.tSocket = socket;
        this.bindEvents();
    }
    bindEvents() {
        if (this.tSocket == null)
            return;
        this.tSocket.onopen = (event) => this.emit('open', event.data);
        this.tSocket.onmessage = (event) => this.emit('message', event.data);
        this.tSocket.onclose = () => this.emit('close');
        this.tSocket.onerror = (error) => this.emit('error', error);
        if (this.peer) {
            this.peer.on('stateChange', (s) => {
                this.emit('stateChange', s);
            });
        }
    }
    isAuthenticated() {
        return this.eureca.authenticated;
    }
    send(data) {
        if (this.tSocket == null)
            return;
        this.tSocket.send(data);
    }
    close() {
        this.tSocket.close();
    }
}

var http, qs, webrtc;
if (Util.isNodejs) {
    qs = require('querystring');
    http = require('http');
    try {
        webrtc = require('wrtc');
    }
    catch (e) {
        //console.error("wrtc module not found : WebRTC support will not be available");
        //process.exit(e.code);
        webrtc = { unavailable: true, error: e };
    }
}
var PeerConnection = Util.isNodejs ? webrtc.RTCPeerConnection : window['RTCPeerConnection'] || window['mozRTCPeerConnection'] || window['webkitRTCPeerConnection'];
var SessionDescription = Util.isNodejs ? webrtc.RTCSessionDescription : window['RTCSessionDescription'] || window['mozRTCSessionDescription'] || window['webkitRTCSessionDescription'];
class Peer extends EventEmitter {
    constructor(settings = { reliable: true }) {
        super();
        this.settings = settings;
        this.id = Util.randomID();
        this.peerConnection = null;
        this.channel = null;
        this.pendingDataChannels = {};
        this.dataChannels = {};
        //const configuration = {"iceServers":[{"url":"stun:stun.ideasip.com","urls":["stun:stun.ideasip.com"]},{"url":"stun:stun.voipstunt.com","urls":["stun:stun.voipstunt.com"]}]}
        this.remainingRetries = 10;
        this.peerSettings = {
            iceServers: [
            //{"url": "stun:stun.services.mozilla.com"},
            //{"urls": "stun:stun.l.google.com:19302"},
            //{"urls": "stun:stun1.l.google.com:19302"},
            //{"urls": "stun:stun2.l.google.com:19302"},
            ]
        };
        //public con = { 'optional': [{ 'DtlsSrtpKeyAgreement': true }] };
        this.channelSettings = {
            reliable: true,
            ordered: true,
            maxRetransmits: null
        };
        this.lastState = '';
        if (webrtc && webrtc.unavailable) {
            console.error("wrtc module not found\n");
            console.error(" * Please follow instructions here https://github.com/js-platform/node-webrtc to install wrtc\n");
            console.error(" * Note : WebRTC is only supported on x64 platforms\n");
            process.exit();
        }
        if (typeof settings.reliable != 'undefined')
            this.channelSettings.reliable = settings.reliable;
        if (typeof settings.maxRetransmits != 'undefined')
            this.channelSettings.maxRetransmits = settings.maxRetransmits;
        if (typeof settings.ordered !== 'undefined')
            this.channelSettings.ordered = settings.ordered;
        if (settings.iceServers instanceof Array)
            this.peerSettings.iceServers = settings.iceServers;
    }
    //we use HTTP for signaling
    signal() {
        const wrtcSettings = this.settings;
        const uri = wrtcSettings.uri;
        //a timeout can occure while the datachannel is estabilishing the connection.
        //if already connected, dont restart negociation 
        if (this.lastState == 'connected' && this.channel.readyState == 'open')
            return;
        if (this.channel) {
            this.channel.close();
            this.lastState = 'retry';
        }
        if (this.remainingRetries <= 0) {
            this.tSocket.emit('close');
            return;
        }
        this.remainingRetries--;
        this.makeOffer().then((pc) => {
            if (Util.isNodejs) {
                const url = require("url");
                const postDataObj = {};
                postDataObj[Protocol.signal] = JSON.stringify(pc.localDescription);
                const post_data = qs.stringify(postDataObj);
                const parsedURI = url.parse(uri);
                const post_options = {
                    host: parsedURI.hostname,
                    port: parsedURI.port,
                    path: '/wrtc-' + wrtcSettings.prefix,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': post_data.length
                    }
                };
                const post_req = http.request(post_options, (res) => {
                    res.setEncoding('utf8');
                    res.on('data', (chunk) => {
                        const resp = JSON.parse(chunk);
                        this.getAnswer(resp[Protocol.signal]);
                        this.remainingRetries = wrtcSettings.retries;
                    });
                });
                post_req.write(post_data);
                post_req.end();
                post_req.on('error', (error) => {
                    setTimeout(() => this.signal(), 3000);
                });
                //
            }
            else {
                const xhr = new XMLHttpRequest();
                const params = Protocol.signal + '=' + JSON.stringify(pc.localDescription);
                const parser = document.createElement('a');
                parser.href = uri;
                xhr.open("POST", '//' + parser.hostname + ':' + parser.port + '/wrtc-' + wrtcSettings.prefix, true);
                //Send the proper header information along with the request
                xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                //xhr.setRequestHeader("Content-length", params.length.toString());
                //xhr.setRequestHeader("Connection", "close");
                xhr.onreadystatechange = () => {
                    if (xhr.readyState == 4 && xhr.status == 200) {
                        const resp = JSON.parse(xhr.responseText);
                        this.getAnswer(resp[Protocol.signal]);
                        this.remainingRetries = wrtcSettings.retries;
                    }
                    else {
                        if (xhr.readyState == 4 && xhr.status != 200) {
                            setTimeout(() => this.signal(), 3000);
                        }
                    }
                };
                xhr.send(params);
            }
            this.tSocket.update(this.channel);
        })
            .catch((error) => this.tSocket.emit('error', error));
    }
    makeOffer() {
        return new Promise((resolve, reject) => {
            const pc = new PeerConnection(this.peerSettings);
            this.peerConnection = pc;
            //this.makeDataChannel();
            pc.onsignalingstatechange = this.onSignalingStateChange.bind(this);
            pc.oniceconnectionstatechange = this.onICEConnectionStateChange.bind(this);
            pc.onicegatheringstatechange = this.onICEGatheringStateChange.bind(this);
            pc.onicecandidate = function (candidate) {
                // Firing this callback with a null candidate indicates that
                // trickle ICE gathering has finished, and all the candidates
                // are now present in pc.localDescription.  Waiting until now
                // to create the answer saves us from having to send offer +
                // answer + iceCandidates separately.
                if (candidate.candidate == null) {
                    resolve(pc);
                }
            };
            // If you don't make a datachannel *before* making your offer (such
            // that it's included in the offer), then when you try to make one
            // afterwards it just stays in "connecting" state forever.  This is
            // my least favorite thing about the datachannel API.
            var channel = pc.createDataChannel('eureca.io', {
                reliable: this.channelSettings.reliable,
                maxRetransmits: this.channelSettings.maxRetransmits,
                ordered: this.channelSettings.ordered
            });
            this.channel = channel;
            pc.createOffer().then(desc => pc.setLocalDescription(desc), reject);
        });
    }
    getAnswer(pastedAnswer) {
        const data = typeof pastedAnswer == 'string' ? JSON.parse(pastedAnswer) : pastedAnswer;
        const answer = new SessionDescription(data);
        this.peerConnection.setRemoteDescription(answer);
    }
    getOffer(pastedOffer, request) {
        return new Promise((resolve, reject) => {
            const data = typeof pastedOffer === 'object' ? pastedOffer : JSON.parse(pastedOffer);
            const pc = new PeerConnection(this.peerSettings);
            this.peerConnection = pc;
            pc.onsignalingstatechange = this.onSignalingStateChange.bind(this);
            pc.oniceconnectionstatechange = this.onICEConnectionStateChange.bind(this);
            pc.onicegatheringstatechange = this.onICEGatheringStateChange.bind(this);
            pc.onicecandidate = (candidate) => {
                // null candidate indicates that
                // trickle ICE gathering has finished, and all the candidates
                // are now present in pc.localDescription.  Waiting until now
                // to create the answer saves us from having to send offer +
                // answer + iceCandidates separately.
                if (candidate.candidate == null) {
                    resolve(pc);
                }
            };
            //var labels = Object.keys(this.dataChannelSettings);
            pc.ondatachannel = (evt) => {
                const channel = evt.channel;
                channel.request = request;
                //__this.channel = channel;
                const label = channel.label;
                this.pendingDataChannels[label] = channel;
                channel.binaryType = 'arraybuffer';
                channel.onopen = () => {
                    this.dataChannels[label] = channel;
                    delete this.pendingDataChannels[label];
                    this.emit('datachannel', channel);
                };
            };
            const offer = new SessionDescription(data);
            pc.setRemoteDescription(offer)
                .then(() => pc.createAnswer(), this.doHandleError)
                .then(desc => pc.setLocalDescription(desc), this.doHandleError);
        });
    }
    onICEConnectionStateChange(state) {
        const pc = this.peerConnection;
        this.emit('stateChange', pc.iceConnectionState);
        this.lastState = pc.iceConnectionState;
        if (this.stateTimeout != undefined)
            clearTimeout(this.stateTimeout);
        if (pc.iceConnectionState == 'disconnected' || pc.iceConnectionState == 'failed') {
            this.emit('disconnected');
        }
        if (pc.iceConnectionState == 'completed' || pc.iceConnectionState == 'connected') {
            //trigger a timeout to check if client successfully connected
            this.stateTimeout = setTimeout(() => this.emit('timeout'), 500);
        }
        else {
            this.stateTimeout = setTimeout(() => this.emit('timeout'), 5000);
        }
    }
    onICEGatheringStateChange(state) {
        //console.info('ice gathering state change:', state);
    }
    onSignalingStateChange(state) {
        //console.log('signal state = ', state);
    }
    doHandleError(error) {
        this.emit('error', error);
    }
}

class Client$1 {
    static create(uri, settings = {}) {
        const wrtcSettings = Object.assign({ uri, retries: settings.retries, prefix: settings.prefix }, settings.transportSettings);
        const clientPeer = new Peer(wrtcSettings);
        const tSocket = new Socket$1(clientPeer.channel, clientPeer);
        clientPeer.remainingRetries = wrtcSettings.retries;
        clientPeer.on('disconnected', () => {
            clientPeer.signal();
        });
        clientPeer.on('timeout', () => {
            clientPeer.signal();
        });
        clientPeer.signal();
        return tSocket;
    }
}

var qs$1;
if (Util.isNodejs) {
    qs$1 = require('querystring');
}
class Server$1 {
    constructor(appServer, settings) {
        this.appServer = appServer;
        this.serverPeer = new Peer();
        const wrtcSettings = Object.assign({ retries: settings.retries, prefix: settings.prefix }, settings.transportSettings);
        let app = appServer;
        if (appServer._events.request !== undefined && appServer.routes === undefined)
            app = appServer._events.request;
        if (app.get && app.post) {
            app.post('/wrtc-' + wrtcSettings.prefix, (request, response) => {
                if (request.body) //body parser present
                 {
                    const offer = request.body[Protocol.signal];
                    this.serverPeer.getOffer(offer, request)
                        .then((pc) => {
                        const resp = {};
                        resp[Protocol.signal] = pc.localDescription;
                        response.write(JSON.stringify(resp));
                        response.end();
                    });
                    return;
                }
                this.processPost(request, response)
                    .then(() => {
                    const offer = request.post[Protocol.signal];
                    response.writeHead(200, "OK", { 'Content-Type': 'text/plain' });
                    return ({ offer, request });
                })
                    .then(({ offer, request }) => this.serverPeer.getOffer(offer, request))
                    .then((pc) => {
                    const resp = {};
                    resp[Protocol.signal] = pc.localDescription;
                    response.write(JSON.stringify(resp));
                    response.end();
                });
            });
        }
        else {
            //we use POST request for webRTC signaling            
            appServer.on('request', (request, response) => {
                if (request.method === 'POST') {
                    if (request.url.split('?')[0] === '/wrtc-' + wrtcSettings.prefix) {
                        this.processPost(request, response)
                            .then(() => {
                            const offer = request.post[Protocol.signal];
                            response.writeHead(200, "OK", { 'Content-Type': 'text/plain' });
                            return ({ offer, request });
                        })
                            .then(({ offer, request }) => this.serverPeer.getOffer(offer, request))
                            .then((pc) => {
                            const resp = {};
                            resp[Protocol.signal] = pc.localDescription;
                            response.write(JSON.stringify(resp));
                            response.end();
                        });
                    }
                }
            });
        }
        this.serverPeer.on('stateChange', (s) => {
            this.appServer.eurecaServer.emit('stateChange', s);
        });
    }
    processPost(request, response) {
        return new Promise((resolve, reject) => {
            let queryData = "";
            if (request.method == 'POST') {
                request.on('data', (data) => {
                    queryData += data;
                    if (queryData.length > 1e6) {
                        queryData = "";
                        response.writeHead(413, { 'Content-Type': 'text/plain' }).end();
                        request.connection.destroy();
                    }
                });
                request.on('end', () => {
                    request.post = qs$1.parse(queryData);
                    resolve();
                });
            }
            else {
                response.writeHead(405, { 'Content-Type': 'text/plain' });
                response.end();
            }
        });
    }
    onconnect(callback) {
        this.serverPeer.on('datachannel', (datachannel) => {
            const socket = new Socket$1(datachannel);
            callback(socket);
        });
    }
    static create(hook, settings) {
        try {
            const server = new Server$1(hook, settings);
            return server;
        }
        catch (ex) {
        }
    }
}

const deserialize = (message) => {
    var jobj;
    if (typeof message != 'object') {
        try {
            jobj = JSON.parse(message);
        }
        catch (ex) { }
    }
    else {
        jobj = message;
    }
    return jobj;
};
const serialize = JSON.stringify;
function register$1() {
    Transport.register('wrtc', '', Client$1.create, Server$1.create, serialize, deserialize);
    Transport.register('webrtc', '', Client$1.create, Server$1.create, serialize, deserialize);
}

var index$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    register: register$1
});

var Transports = /*#__PURE__*/Object.freeze({
    __proto__: null,
    primus: index,
    wrtc: index$1
});

const version = '0.9.0';

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
class Client$2 extends EventEmitter {
    constructor(settings = {}) {
        super();
        this.settings = settings;
        this.exports = {};
        this.contract = [];
        /** @ignore */
        this.__eureca_exports__ = {};
        /** @ignore */
        //this variable keeps track of received name spaces list
        this.__eureca_imports__ = {};
        /** @ignore */
        //this variable checks if we received the initial namespaces list from the server
        this.__eureca_imports_received__ = false;
        this.serverProxy = {};
        /** @ignore */
        this.serialize = (v) => v;
        /** @ignore */
        this.deserialize = (v) => v;
        if (!settings.transport)
            settings.transport = 'engine.io';
        if (!settings.prefix)
            settings.prefix = 'eureca.io';
        if (!settings.clientScript)
            settings.clientScript = '/eureca.js';
        this.loadTransports();
        this.transport = Transport.get(settings.transport);
        if (this.transport.serialize)
            this.serialize = this.transport.serialize;
        if (this.transport.deserialize)
            this.deserialize = this.transport.deserialize;
        settings.serialize = settings.serialize || this.serialize;
        settings.deserialize = settings.deserialize || this.deserialize;
        settings.retries = settings.retries || 20;
        settings.autoConnect = !(settings.autoConnect === false);
        //if (this.settings.autoConnect !== false) 
        this.stub = new Stub(settings);
        if (this.settings.autoConnect)
            setTimeout(this.connect.bind(this), 100);
    }
    loadTransports() {
        for (let tr in Transports)
            if (typeof Transports[tr].register === 'function')
                Transports[tr].register();
    }
    ready(callback) {
        if (callback) {
            if (this.state === 'ready')
                callback();
            else
                this.on('ready', callback);
            return null;
        }
        return new Promise(resolve => {
            this.on('ready', resolve);
        });
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
    authenticate(...args) {
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
    connect() {
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
    disconnect() {
        //this.tries = this.maxRetries + 1;
        this.socket.close();
    }
    _export(obj, name, update = true) {
        if (typeof name !== 'string')
            throw new Error('invalid object name');
        if (name !== '__default__' && this.__eureca_exports__[name]) {
            console.warn(`Export name "${name}" already used, will be overwritten`);
        }
        const cexport = {
            exports: obj,
            contract: Contract.ensureContract(obj),
            context: undefined
        };
        this.__eureca_exports__[name] = cexport;
        if (update) {
            const sendObj = {};
            sendObj[Protocol.contractFnList] = cexport.contract;
            sendObj[Protocol.contractObjId] = name;
            this.socket.send(this.settings.serialize(sendObj));
        }
    }
    import(name = '__default__') {
        return this.socket.import(name);
    }
    _handleClient(clientSocket) {
        const proxy = clientSocket.proxy;
        clientSocket.on('open', () => this.emit('connect', clientSocket));
        clientSocket.on('message', (data) => {
            this.emit('message', data);
            const jobj = this.deserialize.call(clientSocket, data);
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
                        if (!this.__eureca_imports__[ns])
                            this.__eureca_imports__[ns] = false;
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
    update(callback) {
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
    onConnect(callback) {
        this.on('connect', callback);
    }
    /**
     * Bind a callback to 'disconnect' event @see {@link Client#event:disconnect|Client disconnect event}
     * >**Note :** you can also use Client.on('disconnect', callback) to bind disconnect event
     *
     * @function Client#donDisconnect
     *
     */
    onDisconnect(callback) {
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
    onMessage(callback) {
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
    onUnhandledMessage(callback) {
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
    onError(callback) {
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
    onConnectionLost(callback) {
        this.on('connectionLost', callback);
    }
    /**
     * Bind a callback to 'connectionRetry' event
     * >**Note :** you can also use Client.on('connectionRetry', callback) to bind connectionRetry event
     *
     * @function Client#onConnectionRetry
     *
     */
    onConnectionRetry(callback) {
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
    onAuthResponse(callback) {
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
}
var is_nodejs = Util.isNodejs;
if (is_nodejs) {
    var _eureca_prefix = 'eureca.io';
}

//var fs = require('fs');
//var http = require('http');
//var url = require('url');
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
class Server$2 extends EventEmitter {
    constructor(settings = {}) {
        super();
        this.settings = settings;
        this.exports = {};
        this.contract = [];
        this.clients = {};
        this.__eureca_exports__ = {};
        this.__eureca_rest__ = { get: [], put: [], head: [] };
        this.scriptCache = '';
        this.allowedF = [];
        this.serialize = (v) => v;
        this.deserialize = (v) => v;
        if (!settings.transport)
            settings.transport = 'engine.io';
        if (!settings.prefix)
            settings.prefix = 'eureca.io';
        if (!settings.clientScript)
            settings.clientScript = '/eureca.js';
        this.loadTransports();
        this.transport = Transport.get(settings.transport);
        if (this.transport.serialize)
            this.serialize = this.transport.serialize;
        if (this.transport.deserialize)
            this.deserialize = this.transport.deserialize;
        settings.serialize = settings.serialize || this.serialize;
        settings.deserialize = settings.deserialize || this.deserialize;
        this.useAuthentication = (typeof this.settings.authenticate == 'function');
        // if (this.useAuthentication)
        //     this.exports.authenticate = this.settings.authenticate;
        this.allowedF = this.settings.allow instanceof Array ? this.settings.allow : [];
        if (typeof this.settings.allow === 'string') {
            this.settings.allow = this.settings.allow.trim();
            let match = this.settings.allow.match(new RegExp('^/(.*?)/([gimy]*)$'));
            if (!match || match[1])
                this.settings.allow = `/${this.settings.allow.replace('.', '\.').replace('*', '.*')}/`;
            match = this.settings.allow.match(new RegExp('^/(.*?)/([gimy]*)$'));
            if (match)
                this.allowedRx = new RegExp(match[1], match[2]);
        }
        this.stub = new Stub(settings);
    }
    loadTransports() {
        for (let tr in Transports) {
            if (typeof Transports[tr].register === 'function')
                Transports[tr].register();
        }
    }
    sendScript(request, response, prefix) {
        let scriptConfig = '';
        scriptConfig += `\nconst _eureca_prefix = '${prefix}';\n`;
        scriptConfig += `\nconst _eureca_host = '${Util.getUrl(request)}';\n`;
        scriptConfig += "\nconst _eureca_uri = `${_eureca_host}/${_eureca_prefix}`;\n";
        if (this.scriptCache != '') {
            //FIXME : don't cache _eureca_host, it can lead to inconsistencies (for example if you first load the page from localhost then from external IP, the localhost will be cached)
            response.writeHead(200);
            response.write(scriptConfig + this.scriptCache);
            response.end();
            return;
        }
        this.scriptCache = '';
        if (this.transport.script) {
            if (this.transport.script.length < 256 && fs.existsSync(__dirname + this.transport.script))
                this.scriptCache += fs.readFileSync(__dirname + this.transport.script);
            else
                this.scriptCache += this.transport.script;
        }
        //FIXME : override primus hardcoded pathname 
        this.scriptCache += '\nif (typeof Primus != "undefined") Primus.prototype.pathname = "/' + prefix + '";\n';
        //Add eureca client script
        this.scriptCache += fs.readFileSync(__dirname + '/EurecaClient.js');
        response.writeHead(200);
        response.write(scriptConfig + this.scriptCache);
        response.end();
    }
    _export(obj, name, update = true) {
        if (typeof name !== 'string')
            throw new Error('invalid object name');
        if (name !== '__default__' && this.__eureca_exports__[name]) {
            console.warn(`Export name "${name}" already used, will be overwritten`);
        }
        const cexport = {
            exports: obj,
            contract: Contract.ensureContract(obj),
            context: (obj && obj.constructor && obj.constructor.name === 'Object') ? undefined : obj
        };
        this.__eureca_exports__[name] = cexport;
        if (update) {
            const sendObj = {};
            sendObj[Protocol.contractFnList] = cexport.contract;
            sendObj[Protocol.contractObjId] = name;
            if (this.allowedRx !== undefined)
                sendObj[Protocol.command] = this.settings.allow;
            for (let id in this.clients) {
                const eurecaClientSocket = this.clients[id];
                eurecaClientSocket.send(this.settings.serialize(sendObj));
            }
        }
    }
    _handleEurecaClientSocketEvents(eurecaClientSocket) {
        eurecaClientSocket.on('message', (message) => {
            /**
            * Triggered each time a new message is received from a client.
            *
            * @event Server#message
            * @property {String} message - the received message.
            * @property {ISocket} socket - client socket.
            */
            this.emit('message', message, eurecaClientSocket);
            const jobj = this.deserialize.call(eurecaClientSocket, message);
            if (jobj === undefined) {
                this.emit('unhandledMessage', message, eurecaClientSocket);
                return;
            }
            //Handle authentication
            if (jobj[Protocol.authReq] !== undefined) {
                if (typeof this.settings.authenticate == 'function') {
                    const args = jobj[Protocol.authReq];
                    args.push((error) => {
                        if (error == null) {
                            eurecaClientSocket.eureca.authenticated = true;
                            this._export(this.exports, '__default__', false);
                        }
                        const authResponse = {};
                        authResponse[Protocol.authResp] = [error];
                        eurecaClientSocket.send(this.serialize(authResponse));
                        this.emit('authentication', error);
                    });
                    const context = {
                        user: { clientId: eurecaClientSocket.id },
                        socket: eurecaClientSocket,
                        request: eurecaClientSocket['request']
                    };
                    this.settings.authenticate.apply(context, args);
                }
                return;
            }
            if (this.useAuthentication && !eurecaClientSocket.eureca.authenticated) {
                return;
            }
            if (this.allowedRx && jobj[Protocol.contractFnList] !== undefined) {
                const contractObjId = jobj[Protocol.contractObjId] || '__default__';
                //regenerate the client proxy
                this.stub.importRemoteFunction(eurecaClientSocket, jobj[Protocol.contractFnList], contractObjId, this.allowedRx);
                return;
            }
            /*****************************************/
            //handle remote call
            if (jobj[Protocol.functionId] !== undefined) {
                const invokeContext = new InvokeContext(eurecaClientSocket, jobj);
                invokeContext.serialize = this.serialize;
                const handle = jobj[Protocol.contractObjId] ? this.__eureca_exports__[jobj[Protocol.contractObjId]] : this;
                this.stub.invokeLocal(invokeContext, handle);
                return;
            }
            //handle remote response
            if (jobj[Protocol.signatureId] !== undefined) //invoke result
             {
                //_this.stub.doCallBack(jobj[Protocol.signatureId], jobj[Protocol.resultId], jobj[Protocol.errorId]);
                Stub.doCallBack(jobj[Protocol.signatureId], jobj[Protocol.resultId], jobj[Protocol.errorId], eurecaClientSocket);
                return;
            }
            this.emit('unhandledMessage', message, eurecaClientSocket);
        });
        eurecaClientSocket.on('error', (e) => {
            /**
            * triggered if an error occure.
            *
            * @event Server#error
            * @property {String} error - the error message
            * @property {ISocket} socket - client socket.
            */
            this.emit('error', e, eurecaClientSocket);
        });
        eurecaClientSocket.on('close', () => {
            /**
            * triggered when the client is disconneced.
            *
            * @event Server#disconnect
            * @property {ISocket} socket - client socket.
            */
            this.emit('disconnect', eurecaClientSocket);
            delete this.clients[eurecaClientSocket.id];
        });
        eurecaClientSocket.on('stateChange', (s) => {
            this.emit('stateChange', s);
        });
    }
    _handleServer(ioServer) {
        //ioServer.on('connection', function (socket) {
        ioServer.onconnect((eurecaClientSocket) => {
            if (eurecaClientSocket.request && eurecaClientSocket.request.primus) {
                eurecaClientSocket.eureca.remoteAddress = eurecaClientSocket.request.primus.remoteAddress;
                eurecaClientSocket.eureca.remotePort = eurecaClientSocket.request.primus.remotePort;
            }
            else {
                eurecaClientSocket.eureca.remoteAddress = eurecaClientSocket.remoteAddress;
            }
            this.clients[eurecaClientSocket.id] = eurecaClientSocket;
            //send contract to client
            //this.sendContract(eurecaClientSocket);
            if (!this.useAuthentication)
                this._export(this.exports, '__default__', false);
            //generate client proxy
            eurecaClientSocket.proxy = this.getClient(eurecaClientSocket.id);
            //Deprecation wrapper
            Object.defineProperty(eurecaClientSocket, 'clientProxy', {
                get: function () {
                    console.warn('Deprecated syntax, please use socket.proxy instead of socket.clientProxy');
                    return eurecaClientSocket.proxy;
                }
            });
            this._handleEurecaClientSocketEvents(eurecaClientSocket);
            for (let name in this.__eureca_exports__) {
                const cexport = this.__eureca_exports__[name];
                const sendObj = {};
                sendObj[Protocol.contractFnList] = cexport.contract;
                sendObj[Protocol.contractObjId] = name;
                //add ns list
                if (name === '__default__')
                    sendObj[Protocol.nsListId] = Object.keys(this.__eureca_exports__);
                if (this.allowedRx !== undefined)
                    sendObj[Protocol.command] = this.settings.allow;
                eurecaClientSocket.send(this.settings.serialize(sendObj));
            }
            this.emit('connect', eurecaClientSocket);
        });
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
    getClient(id) {
        const socket = this.clients[id];
        if (socket === undefined)
            return undefined;
        if (socket.proxy !== undefined)
            return socket.proxy;
        this.stub.importRemoteFunction(socket, socket.contract || this.allowedF, undefined, this.allowedRx);
        return socket.proxy;
    }
    /**
     * returns the client socket
     * @param id connection id
     */
    getClientSocket(id) {
        return this.clients[id];
    }
    getConnection(id) {
        console.warn('getConnection() is deprecated, please use getClientSocket() instead');
        return this.getClientSocket(id);
    }
    /**
     * Sends exported server functions to all connected clients <br />
     *
     * @function bind
     * @memberof Server#
     * @param {appServer} - a nodejs {@link https://nodejs.org/api/http.html#http_class_http_server|nodejs http server}
     *  or {@link http://expressjs.com/api.html#application|expressjs Application}
     *
     */
    bind(httpServer) {
        let app = undefined;
        //is it express application ?
        if (httpServer._events && httpServer._events.request !== undefined && httpServer.routes === undefined && httpServer._events.request.on)
            app = httpServer._events.request;
        //is standard http server ?
        if (app === undefined && httpServer instanceof http$1.Server)
            app = httpServer;
        //not standard http server nor express app ==> try to guess http.Server instance
        if (app === undefined) {
            var keys = Object.getOwnPropertyNames(httpServer);
            for (let k of keys) {
                if (httpServer[k] instanceof http$1.Server) {
                    //got it !
                    app = httpServer[k];
                    break;
                }
            }
        }
        this.appServer = httpServer;
        //this._checkHarmonyProxies();
        httpServer.eurecaServer = this;
        this.ioServer = this.transport.createServer(httpServer, this.settings);
        this._handleServer(this.ioServer);
        //install on express
        //sockjs_server.installHandlers(server, {prefix:_prefix});            
        if (app.get && app.post) //TODO : better way to detect express
         {
            app.get(this.settings.clientScript, (request, response) => this.sendScript(request, response, this.settings.prefix));
        }
        else //Fallback to nodejs
         {
            app.on('request', (request, response) => {
                if (request.method === 'GET') {
                    if (request.url.split('?')[0] === this.settings.clientScript) {
                        this.sendScript(request, response, this.settings.prefix);
                    }
                }
            });
        }
    }
    attach(appServer) {
        console.warn('DEPRECATED: Eureca.Server.attach() is deprecated, please use Eureca.Server.bind() instead');
        return this.bind(appServer);
    }
    getify(fnList) {
        let whiteListRx;
        if (!fnList)
            fnList = '*';
        if (fnList instanceof RegExp)
            whiteListRx = fnList;
        else if (typeof fnList === 'string')
            whiteListRx = Util.str2RegExp(fnList);
        if (!whiteListRx && !(fnList instanceof Array))
            return;
        this.appServer.prependListener('request', (request, response) => {
            if (request.method === 'GET' || request.method === 'POST') {
                let body = [];
                request.on('data', (chunk) => {
                    body.push(chunk);
                }).on('end', () => {
                    body = Buffer.concat(body).toString();
                    // at this point, `body` has the entire request body stored in it as a string
                    console.log('got body ', body);
                });
                console.log('REQ', request.url, request.body);
                const uri = request.url;
                const queryObject = url.parse(uri, true).query;
                console.log('Query Object', queryObject);
                if (uri.indexOf('/eureca.rest/') === 0) {
                    const fName = uri.substr(uri, uri.indexOf('/:'))
                        .replace('/eureca.rest/', '')
                        .trim();
                    if ((whiteListRx && !whiteListRx.test(fName)) //not valid according to regexp
                        || // OR
                            (fnList instanceof Array && fnList.indexOf(fName) < 0) //not valid because not present in functions list
                    ) {
                        return response.writeHead(401, { 'Content-Type': 'text/plain' }).end('Unauthorized GET call to ' + fName);
                    }
                    const args = uri.substr(uri.indexOf('/:') + 2).split('/:');
                    console.log('Function = ', fName, args);
                    const tokens = fName.split('.');
                    const ns = tokens.shift();
                    const restInvokeContext = {
                        sendResult: function (data, error, code) {
                            response.writeHead(code, { 'Content-Type': 'text/plain' }).end(code === 200 ? data : error);
                        },
                        message: {}
                    };
                    restInvokeContext.message[Protocol.contractObjId] = this.__eureca_exports__[ns] ? ns : '__default__';
                    restInvokeContext.message[Protocol.functionId] = this.__eureca_exports__[ns] ? tokens.join('.') : fName;
                    restInvokeContext.message[Protocol.argsId] = args;
                    restInvokeContext.message[Protocol.signatureId] = Util.randomID();
                    const handle = this.__eureca_exports__[ns] || this;
                    this.stub.invokeLocal(restInvokeContext, handle);
                    //return response.end('call ' + fName);
                }
            }
        });
    }
    //#region ==[ Deprecated Events bindings ]===================
    onConnect(callback) {
        this.on('connect', callback);
    }
    onDisconnect(callback) {
        this.on('disconnect', callback);
    }
    onMessage(callback) {
        this.on('message', callback);
    }
    onError(callback) {
        this.on('error', callback);
    }
}

exports.Client = Client$2;
exports.Protocol = Protocol;
exports.Server = Server$2;
exports.Transport = Transport;
exports.version = version;

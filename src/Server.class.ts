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


import * as fs from "fs";
import * as http from "http";
import * as url from "url";

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
export class Server extends EventEmitter {
    public transport;
    public exports = {};
    public stub: Stub;
    public contract = [];

    public clients = {};


    private appServer;

    private __eureca_exports__: any = {};
    private __eureca_rest__: any = { get: [], put: [], head: [] };

    private scriptCache = '';

    private useAuthentication: boolean;

    /**
     * Allowed regular expression is used to check the validity of a function received from client
     */
    private allowedRx: RegExp;
    private allowedF: Array<string> = [];

    private ioServer: IServer;


    private serialize = (v) => v;
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


        this.useAuthentication = (typeof this.settings.authenticate == 'function');

        // if (this.useAuthentication)
        //     this.exports.authenticate = this.settings.authenticate;


        this.allowedF = this.settings.allow instanceof Array ? this.settings.allow : [];


        if (typeof this.settings.allow === 'string') {
            this.settings.allow = this.settings.allow.trim();

            let match = this.settings.allow.match(new RegExp('^/(.*?)/([gimy]*)$'));
            if (!match || match[1]) this.settings.allow = `/${this.settings.allow.replace('.', '\.').replace('*', '.*')}/`;



            match = this.settings.allow.match(new RegExp('^/(.*?)/([gimy]*)$'));
            if (match) this.allowedRx = new RegExp(match[1], match[2]);
        }

        this.stub = new Stub(settings);

    }



    private loadTransports() {
        for (let tr in Transports) {
            if (typeof Transports[tr].register === 'function') Transports[tr].register();
        }
    }

    private sendScript(request, response, prefix) {

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

    private _export(obj, name, update = true) {
        if (typeof name !== 'string') throw new Error('invalid object name');
        if (name !== '__default__' && this.__eureca_exports__[name]) {
            console.warn(`Export name "${name}" already used, will be overwritten`);
        }
        const cexport = {
            exports: obj,
            contract: Contract.ensureContract(obj),
            context: (obj && obj.constructor && obj.constructor.name === 'Object') ? undefined : obj
        }
        this.__eureca_exports__[name] = cexport;


        if (update) {
            const sendObj = {};
            sendObj[Protocol.contractFnList] = cexport.contract;
            sendObj[Protocol.contractObjId] = name;



            if (this.allowedRx !== undefined)
                sendObj[Protocol.command] = this.settings.allow;



            for (let id in this.clients) {
                const eurecaClientSocket: ISocket = this.clients[id];
                eurecaClientSocket.send(this.settings.serialize(sendObj));
            }
        }

    }


    private _handleEurecaClientSocketEvents(eurecaClientSocket: ISocket) {

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

                    const context: any = {
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

    private _handleServer(ioServer: IServer) {

        //ioServer.on('connection', function (socket) {
        ioServer.onconnect((eurecaClientSocket: ISocket) => {


            if ((<any>eurecaClientSocket).request && (<any>eurecaClientSocket).request.primus) {
                eurecaClientSocket.eureca.remoteAddress = (<any>eurecaClientSocket).request.primus.remoteAddress;
                eurecaClientSocket.eureca.remotePort = (<any>eurecaClientSocket).request.primus.remotePort;
            }
            else {
                eurecaClientSocket.eureca.remoteAddress = (<any>eurecaClientSocket).remoteAddress;
            }
            this.clients[eurecaClientSocket.id] = eurecaClientSocket;


            //send contract to client
            //this.sendContract(eurecaClientSocket);
            if (!this.useAuthentication) this._export(this.exports, '__default__', false);

            //generate client proxy
            eurecaClientSocket.proxy = this.getClient(eurecaClientSocket.id);

            //Deprecation wrapper
            Object.defineProperty(eurecaClientSocket, 'clientProxy', {
                get: function () {
                    console.warn('DEPRECATED: socket.clientProxy is deprecated, please use socket.proxy instead');
                    return eurecaClientSocket.proxy;
                }
            })

            this._handleEurecaClientSocketEvents(eurecaClientSocket);


            for (let name in this.__eureca_exports__) {
                const cexport = this.__eureca_exports__[name];
                const sendObj = {};
                sendObj[Protocol.contractFnList] = cexport.contract;
                sendObj[Protocol.contractObjId] = name;

                //add ns list
                if (name === '__default__') sendObj[Protocol.nsListId] = Object.keys(this.__eureca_exports__);


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
    public getClient(id) {

        const socket: ISocket = this.clients[id];

        if (socket === undefined) return undefined;
        if (socket.proxy !== undefined) return socket.proxy;

        this.stub.importRemoteFunction(socket, socket.contract || this.allowedF, undefined, this.allowedRx);

        return socket.proxy;
    }

    /**
     * returns the client socket
     * @param id connection id
     */
    public getClientSocket(id) {
        return this.clients[id];
    }
    public getConnection(id) {
        console.warn('DEPRECATED: getConnection() is deprecated, please use getClientSocket() instead');
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
    public bind(httpServer: any) {

        let app = undefined;



        //is it express application ?
        if (httpServer._events && httpServer._events.request !== undefined && httpServer.routes === undefined && httpServer._events.request.on)
            app = httpServer._events.request;


        //is standard http server ?
        if (app === undefined && httpServer instanceof http.Server)
            app = httpServer




        //not standard http server nor express app ==> try to guess http.Server instance
        if (app === undefined) {
            var keys = Object.getOwnPropertyNames(httpServer);
            for (let k of keys) {
                if (httpServer[k] instanceof http.Server) {
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
        if (app.get && app.post)  //TODO : better way to detect express
        {
            app.get(this.settings.clientScript, (request, response) => this.sendScript(request, response, this.settings.prefix));
        }
        else  //Fallback to nodejs
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

    public attach(appServer: any) {
        console.warn('DEPRECATED: Eureca.Server.attach() is deprecated, please use Eureca.Server.bind() instead');
        return this.bind(appServer);
    }



    public getify(fnList?: any) {
        let whiteListRx: RegExp;

        if (!fnList) fnList = '*';

        if (fnList instanceof RegExp) whiteListRx = fnList;
        else if (typeof fnList === 'string') whiteListRx = Util.str2RegExp(fnList);


        if (!whiteListRx && !(fnList instanceof Array)) return;



        this.appServer.prependListener('request', (request, response) => {
            if (request.method === 'GET' || request.method === 'POST') {

                let body: any = [];
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


                    if (
                        (whiteListRx && !whiteListRx.test(fName))               //not valid according to regexp
                        ||                                                      // OR
                        (fnList instanceof Array && fnList.indexOf(fName) < 0)  //not valid because not present in functions list
                    ) {
                        return response.writeHead(401, { 'Content-Type': 'text/plain' }).end('Unauthorized GET call to ' + fName);
                    }


                    const args = uri.substr(uri.indexOf('/:') + 2).split('/:')

                    console.log('Function = ', fName, args);

                    const tokens = fName.split('.');
                    const ns = tokens.shift();


                    const restInvokeContext = {
                        sendResult: function (data, error, code) {
                            response.writeHead(code, { 'Content-Type': 'text/plain' }).end(code === 200 ? data : error);
                        },
                        message: {}
                    }
                    restInvokeContext.message[Protocol.contractObjId] = this.__eureca_exports__[ns] ? ns : '__default__';
                    restInvokeContext.message[Protocol.functionId] = this.__eureca_exports__[ns] ? tokens.join('.') : fName;
                    restInvokeContext.message[Protocol.argsId] = args;
                    restInvokeContext.message[Protocol.signatureId] = Util.randomID();

                    const handle = this.__eureca_exports__[ns] || this;

                    this.stub.invokeLocal(<any>restInvokeContext, handle)
                    //return response.end('call ' + fName);
                }
            }
        });
    }




    //#region ==[ Deprecated Events bindings ]===================
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
    //#endregion
}


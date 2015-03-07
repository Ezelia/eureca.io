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

/**
 * 
 * @namespace Eureca
 */

module Eureca {

    /**
     * Eureca client class
     * @class Client
     */
    export class Client extends EObject {


        private _ready: boolean;


        public maxRetries: number;
        public tries: number=0;
        public prefix: string;
        public uri: string;
        public exports: any;
        public socket: any;
        public contract: string[];
        
        private stub: Stub;
        private transport: any;        

        

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




            this.registerEvents(['ready', 'update', 'onConnect', 'onDisconnect', 'onError', 'onMessage', 'onConnectionLost', 'onConnectionRetry']);


            if (this.settings.autoConnect) this.connect();

            

        }

        public disconnect()
        {
            this.tries = this.maxRetries+1;
            this.socket.close();
        }
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


            client.onopen(function () {                
                _this.trigger('onConnect', client);
                _this.tries = 0;                
            });


            client.onmessage(function (data) {
                _this.trigger('onMessage', data);

                var jobj: any;
                try {
                    jobj = JSON.parse(data);
                }
                catch (ex) {
                    jobj = {};
                }

                if (jobj[Eureca.Protocol.contractId]) //should be first message
                {
                    var update = _this.contract && _this.contract.length > 0;

                    _this.contract = jobj[Eureca.Protocol.contractId];
                    _this.stub.importRemoteFunction(_this, _this.socket, jobj[Eureca.Protocol.contractId]);


                    var next = function () {
                        _this._ready = true;
                        if (update)
                            _this.trigger('update', _this, _this.contract);
                         else
                            _this.trigger('ready', _this, _this.contract);
                    }

                    if (_this.settings.authenticate) _this.settings.authenticate(_this, next);
                    else next();

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


            client.ondisconnect(function (opts) {
                _this.trigger('onConnectionRetry', opts);
                /*
                
                _this.tries++;
                if (_this.tries > _this.maxRetries) //handle 1002 and 1006 sockjs error codes
                {
                    _this.trigger('onConnectionLost');
                    
                    return;
                }
                //var utime = Math.pow(2, tries);
                var utime = _this.tries;
                setTimeout(function () {
                    _this.connect();
                }, utime * 1000);
            */
            });


            client.onclose(function (e) {
                _this.trigger('onDisconnect', client, e);
                _this.trigger('onConnectionLost');
            });

            client.onerror(function (e) {
                _this.trigger('onError', e);
            });


        }


    }

}

if (is_nodejs) exports.Eureca = Eureca;
else var EURECA = Eureca.Client;
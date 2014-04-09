/// <reference path="transport/Primus.transport.ts" />
/// <reference path="Stub.ts" />
/// <reference path="EObject.class.ts" />
/// <reference path="Util.class.ts" />

declare var require: any;
declare var exports: any;

declare var eio: any;
declare var _eureca_host: any;
declare var _eureca_uri: any;


var is_nodejs = Eureca.Util.isNodejs;
if (is_nodejs) {
    var _eureca_prefix = 'eureca.io';
}

var EurecaSocket = function (uri, options) {
    if (is_nodejs) {
        var sock = require('engine.io-client')(uri, options);
        return sock;
    } else {
        return new eio.Socket(uri, options);
    }
};

module Eureca {

    // Class
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
        
        // Constructor
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




            this.registerEvents(['ready', 'onConnect', 'onDisconnect', 'onError', 'onMessage', 'onConnectionLost', 'onConnectionRetry']);


            if (this.settings.autoConnect) this.connect();

            

        }
        disconnect()
        {
            this.tries = this.maxRetries+1;
            this.socket.close();
        }
        connect() {
            
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
                
                try {
                    var jobj = JSON.parse(data);
                }
                catch (ex) {
                    var jobj = {};
                }

                if (jobj.__eureca__) //should be first message
                {
                    _this.contract = jobj.__eureca__;
                    _this.stub.importRemoteFunction(_this, _this.socket, jobj.__eureca__);


                    var next = function () {
                        _this._ready = true;
                        _this.trigger('ready', _this);
                    }

                    if (_this.settings.authenticate) _this.settings.authenticate(_this, next);
                    else next();

                    return;
                }

                // /!\ ordre is important we have to check invoke BEFORE callback
                if (jobj.f !== undefined) //server invoking client
                    //TODO : check f validity !
                {
                    var context: any = { user: { clientId: _this.socket.id }, connection: _this.socket, async: false, retId: jobj._r, 'return': function (result) { this.connection.send(JSON.stringify({ _r: this.retId, r: result })); } };

                    _this.stub.invoke(context, _this, jobj, _this.socket);
                    return;
                }

                if (jobj._r !== undefined) //invoke result
                {
                    _this.stub.doCallBack(jobj._r, jobj.r);
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
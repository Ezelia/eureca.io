var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var is_nodejs = Eureca.Util.isNodejs;
if(is_nodejs) {
    var _eureca_prefix = 'eureca.io';
}
var EurecaSocket = function (uri, options) {
    if(is_nodejs) {
        var sock = require('engine.io-client')(uri, options);
        return sock;
    } else {
        return new eio.Socket(uri, options);
    }
};
var Eureca;
(function (Eureca) {
    var Client = (function (_super) {
        __extends(Client, _super);
        function Client(settings) {
            if (typeof settings === "undefined") { settings = {
            }; }
                _super.call(this);
            this.settings = settings;
            this.tries = 0;
            this.stub = new Eureca.Stub(settings);
            settings.transport = settings.transport || 'engine.io';
            console.log('* using ' + settings.transport);
            this.transport = Eureca.Transport.get(settings.transport);
            var _this = this;
            this.exports = {
            };
            this.settings.autoConnect = !(this.settings.autoConnect === false);
            this.maxRetries = settings.retry || 20;
            this.registerEvents([
                'ready', 
                'onConnect', 
                'onDisconnect', 
                'onError', 
                'onMessage', 
                'onConnectionLost', 
                'onConnectionRetry'
            ]);
            if(this.settings.autoConnect) {
                this.connect();
            }
        }
        Client.prototype.disconnect = function () {
            this.tries = this.maxRetries + 1;
            this.socket.close();
        };
        Client.prototype.connect = function () {
            var _this = this;
            var prefix = '';
            prefix += this.settings.prefix || _eureca_prefix;
            var _eureca_uri = _eureca_uri || undefined;
            var uri = this.settings.uri || (prefix ? _eureca_host + '/' + prefix : (_eureca_uri || undefined));
            console.log(uri, prefix);
            _this._ready = false;
            var client = this.transport.createClient(uri, {
                prefix: prefix
            });
            _this.socket = client;
            client.onopen(function () {
                _this.trigger('onConnect', client);
                _this.tries = 0;
            });
            client.onmessage(function (data) {
                _this.trigger('onMessage', data);
                try  {
                    var jobj = JSON.parse(data);
                } catch (ex) {
                    var jobj = {
                    };
                }
                if(jobj.__eureca__) {
                    _this.contract = jobj.__eureca__;
                    _this.stub.importRemoteFunction(_this, _this.socket, jobj.__eureca__);
                    _this._ready = true;
                    _this.trigger('ready', _this);
                    return;
                }
                if(jobj.f !== undefined) {
                    _this.stub.invoke(_this.exports, _this, jobj, _this.socket);
                    return;
                }
                if(jobj._r !== undefined) {
                    _this.stub.doCallBack(jobj._r, jobj.r);
                    return;
                }
            });
            client.ondisconnect(function (e) {
                _this.trigger('onConnectionRetry');
                _this.tries++;
                if(_this.tries > _this.maxRetries) {
                    _this.trigger('onConnectionLost');
                    return;
                }
                var utime = _this.tries;
                setTimeout(function () {
                    _this.connect();
                }, utime * 1000);
            });
            client.onclose(function (e) {
                _this.trigger('onDisconnect', client, e);
            });
            client.onerror(function (e) {
                _this.trigger('onError', e);
            });
        };
        return Client;
    })(Eureca.EObject);
    Eureca.Client = Client;    
})(Eureca || (Eureca = {}));
if(is_nodejs) {
    exports.Eureca = Eureca;
} else {
    var EURECA = Eureca.Client;
}
//@ sourceMappingURL=Client.class.js.map

/// <reference path="Util.class.ts" />



// Module
module Eureca {

    // Class
    export class Stub {

        private callbacks: any;
        // Constructor
        constructor(public settings?: any = {}) {
            this.callbacks = {};
        }

        registerCallBack(sig, cb) {
            this.callbacks[sig] = cb;
        }
        doCallBack(sig, result) {
            if (!sig) return;
            var proxyObj = this.callbacks[sig];
            delete this.callbacks[sig];
            if (proxyObj !== undefined) proxyObj.callback(result);
        }

        importRemoteFunction(handle, socket, functions) {   
            var _this = this;
            if (functions === undefined) return;
            for (var i = 0; i < functions.length; i++) {
                (function (idx, fname) {
                    var proxy = handle;
                    /* namespace parsing */
                    var ftokens = fname.split('.');
                    for (var i = 0; i < ftokens.length - 1; i++) {
                        proxy[ftokens[i]] = proxy[ftokens[i]] || {};
                        proxy = proxy[ftokens[i]];
                    }
                    var _fname = ftokens[ftokens.length - 1];
                    /* end namespace parsing */
                    proxy[_fname] = function () {
                        var proxyObj = {
                            callback: function () { },
                            onReady: function (fn)
                            {
                                if (typeof fn == 'function')
                                {
                                    this.callback = fn;
                                }
                            }
                        }

                        var RMIObj: any = {};

                        
                        var argsArray = Array.prototype.slice.call(arguments, 0);
                        var uid = Eureca.Util.randomStr();

                        _this.registerCallBack(uid, proxyObj);

                        /*                        
                        var cb = argsArray[argsArray.length - 1];
                        if (typeof cb == 'function') {
                            cb = argsArray.pop();
                            _this.registerCallBack(uid, cb);
                        }
                        /**/

                        RMIObj.f = _this.settings.useIndexes ? idx : fname;
                        RMIObj._r = uid;
                        if (argsArray.length > 0) RMIObj.a = argsArray;
                        socket.send(JSON.stringify(RMIObj));

                        return proxyObj;
                    }
                })(i, functions[i]);
            }
            //this._ready = true;
            //this.trigger('ready', this);
            //if (typeof this._readyCB == 'function') this._readyCB();
            //this._readyCB = false;
        }

        invoke(context, handle, obj, socket?) {
            //var handle = <any>this.handle;
            /*
            if (obj._r === undefined)
            {
                console.log('Invoke error');
                return;
            }
            */
            /* browing namespace */
            //var ftokens = obj.f.split('.');
            //var func = handle.exports;
            //for (var i = 0; i < ftokens.length; i++) func = func[ftokens[i]];
            ///* ***************** */

            ////var func = this.exports[obj.f];
            //if (typeof func != 'function') {
            //    console.log("Invoke error, unknown function : " + obj.f);
            //    return;
            //}
            //var result = func.apply(context, obj.a);

            
            var fId = parseInt(obj.f);
            var fname = isNaN(fId) ? obj.f : handle.contract[fId];

            /* browing namespace */
            var ftokens = fname.split('.');
            var func = handle.exports;
            for (var i = 0; i < ftokens.length; i++) func = func[ftokens[i]];
            /* ***************** */


            //var func = this.exports[fname];
            if (typeof func != 'function') {
                //socket.send('Invoke error');
                console.log('Invoke error', obj.f + ' is not a function', '');
                return;
            }
            //obj.a.push(conn); //add connection object to arguments



            try {
                obj.a = obj.a || [];
                var result = func.apply(context, obj.a);

                //console.log('sending back result ', result, obj)
                if (socket && obj._r) socket.send(JSON.stringify({ _r: obj._r, r: result }));

                obj.a.unshift(socket);
                if (typeof func.onCall == 'function') func.onCall.apply(context, obj.a);
            } catch (ex) {
                console.log('EURECA Invoke exception!! ', ex.stack);
            }

        }
    }

}

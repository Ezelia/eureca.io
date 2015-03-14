/// <reference path="Protocol.config.ts" />

/// <reference path="Util.class.ts" />



/** @ignore */
module Eureca {

    // Class
    export class Stub {

        private callbacks: any;
        // Constructor
        constructor(public settings: any = {}) {
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

        /**
         * 
         */
        importRemoteFunction(handle, socket, functions) {
            //TODO : improve this using cache

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

                    //TODO : do we need to re generate proxy function if it's already declared ?
                    proxy[_fname] = function () {
                        //TODO : register signature ID to be able to trigger result later.
                        var proxyObj = {
                            /* TODO : save uid/sig here*/
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



                        RMIObj[Protocol.functionId] = _this.settings.useIndexes ? idx : fname;
                        RMIObj[Protocol.signatureId] = uid;
                        if (argsArray.length > 0) RMIObj[Protocol.argsId] = argsArray;
                        socket.send(JSON.stringify(RMIObj));

                        return proxyObj;
                    }
                })(i, functions[i]);
            }

        }

        invoke(context, handle, obj, socket?) {


            var fId = parseInt(obj[Protocol.functionId]);
            var fname = isNaN(fId) ? obj[Protocol.functionId] : handle.contract[fId];

            /* browing namespace */
            var ftokens = fname.split('.');
            var func = handle.exports;
            for (var i = 0; i < ftokens.length; i++)
                func = func[ftokens[i]];
            /* ***************** */


            //var func = this.exports[fname];
            if (typeof func != 'function') {
                //socket.send('Invoke error');
                console.log('Invoke error', obj[Protocol.functionId] + ' is not a function', '');
                return;
            }
            //obj.a.push(conn); //add connection object to arguments



            try {
                obj[Protocol.argsId] = obj[Protocol.argsId] || [];
                var result = func.apply(context, obj[Protocol.argsId]);

                //console.log('sending back result ', result, obj)

                if (socket && obj[Protocol.signatureId] && !context.async) {

                    var retObj = {};
                    retObj[Protocol.signatureId] = obj[Protocol.signatureId];
                    retObj[Protocol.resultId] = result;

                    socket.send(JSON.stringify(retObj));
                }

                obj[Protocol.argsId].unshift(socket);
                if (typeof func.onCall == 'function') func.onCall.apply(context, obj[Protocol.argsId]);
            } catch (ex) {
                console.log('EURECA Invoke exception!! ', ex.stack);
            }

        }
    }

}

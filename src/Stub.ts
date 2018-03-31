/// <reference path="Protocol.config.ts" />

/// <reference path="Util.class.ts" />
/// <reference path="eurecapromise.ts" />



/** @ignore */
module Eureca {

    // Class
    export class Stub {

        private static callbacks: any = {};
        private serialize:Function;
        private deserialize:Function;
        // Constructor
        constructor(public settings: any = {}) {
            //this.callbacks = {};
            this.serialize = settings.serialize;
            this.deserialize = settings.deserialize;
        }

        static registerCallBack(sig, cb) {
            this.callbacks[sig] = cb;
        }

        static doCallBack(sig, result, error) {
            if (!sig) return;
            var proxyObj = this.callbacks[sig];
            delete this.callbacks[sig];

            if (proxyObj !== undefined) {
                proxyObj.status = 1;
                //proxyObj.result = result;
                //proxyObj.error = error;

                if (error == null)
                    proxyObj.resolve(result);
                else
                    proxyObj.reject(error);
            }
        }


        //invoke remote function by creating a proxyObject and sending function name and arguments to the remote side
        public invokeRemoteOld(context, fname, socket, ...args) {
            
            var proxyObj = {
                status: 0,
                result: null,
                error: null,
                sig: null,
                callback: function () { },
                errorCallback: function () { },
                //TODO : use the standardized promise syntax instead of onReady
                then: function (fn, errorFn) {
                    if (this.status != 0) {

                        if (this.error == null)
                            fn(this.result);
                        else
                            errorFn(this.error);

                        return;
                    }

                    if (typeof fn == 'function') {
                        this.callback = fn;
                    }

                    if (typeof errorFn == 'function') {
                        this.errorCallback = errorFn;
                    }

                }
            }
            //onReady retro-compatibility with older eureca.io versions
            proxyObj['onReady'] = proxyObj.then;

            var RMIObj: any = {};


            var argsArray = args;//Array.prototype.slice.call(arguments, 0);
            var uid = Eureca.Util.randomStr();
            proxyObj.sig = uid;


            Stub.registerCallBack(uid, proxyObj);



            RMIObj[Protocol.functionId] = /*this.settings.useIndexes ? idx : */fname;
            RMIObj[Protocol.signatureId] = uid;
            if (argsArray.length > 0) RMIObj[Protocol.argsId] = argsArray;


            
            socket.send(this.settings.serialize.call(context, RMIObj));

            
            return proxyObj;
        }

        public invokeRemote(context, fname, socket, ...args) {
            
            let resolveCB: any;
            let rejectCB: any;
            var proxyObj = new EurecaPromise((resolve, reject) => {
                resolveCB = resolve;
                rejectCB = reject;
            });

            proxyObj.resolve = resolveCB;
            proxyObj.reject = rejectCB;

            var RMIObj: any = {};


            var argsArray = args;//Array.prototype.slice.call(arguments, 0);
            var uid = Eureca.Util.randomStr();
            proxyObj.sig = uid;


            Stub.registerCallBack(uid, proxyObj);



            RMIObj[Protocol.functionId] = /*this.settings.useIndexes ? idx : */fname;
            RMIObj[Protocol.signatureId] = uid;
            if (argsArray.length > 0) RMIObj[Protocol.argsId] = argsArray;



            socket.send(this.settings.serialize.call(context, RMIObj));


            return proxyObj;
        }
        /**
         * Generate proxy functions allowing to call remote functions
         */
        public importRemoteFunction(handle, socket, functions/*, serialize=null*/) {
            

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
                    proxy[_fname] = function (...args) {
                        
                        args.unshift(socket);
                        args.unshift(fname);
                        args.unshift(proxy[_fname]);
                        return _this.invokeRemote.apply(_this, args);
                        
                        /*
                        var proxyObj = {
                            status: 0,
                            result: null,
                            error: null,
                            sig:null,
                            callback: function () { },
                            errorCallback: function () { },                            
                            //TODO : use the standardized promise syntax instead of onReady
                            then: function (fn, errorFn) {
                                if (this.status != 0) {

                                    if (this.error == null)
                                        fn(this.result);
                                    else
                                        errorFn(this.error);

                                    return;
                                }

                                if (typeof fn == 'function') {
                                    this.callback = fn;
                                }

                                if (typeof errorFn == 'function') {
                                    this.errorCallback = errorFn;
                                }

                            }
                        }
                        //onReady retro-compatibility with older eureca.io versions
                        proxyObj['onReady'] = proxyObj.then;

                        var RMIObj: any = {};

                        
                        var argsArray = args;//Array.prototype.slice.call(arguments, 0);
                        var uid = Eureca.Util.randomStr();
                        proxyObj.sig = uid;


                        Stub.registerCallBack(uid, proxyObj);



                        RMIObj[Protocol.functionId] = _this.settings.useIndexes ? idx : fname;
                        RMIObj[Protocol.signatureId] = uid;
                        if (argsArray.length > 0) RMIObj[Protocol.argsId] = argsArray;

                        //Experimental custom context sharing
                        //allow sharing global context (set in serverProxy/clientProxy) or local proxy set in the caller object
                        //if (proxy[_fname].context || handle.context) RMIObj[Protocol.context] = proxy[_fname].context || handle.context;

                        //socket.send(JSON.stringify(RMIObj));
                        socket.send(_this.settings.serialize.call(proxyObj, RMIObj));

                        return proxyObj;
                        */
                        
                    }
                })(i, functions[i]);
            }

        }


        private sendResult(socket, sig, result, error) {
            if (!socket) return;
            var retObj = {};
            retObj[Protocol.signatureId] = sig;
            retObj[Protocol.resultId] = result;
            retObj[Protocol.errorId] = error;
            socket.send(this.serialize(retObj));
        }


        //invoke exported function and send back the result to the invoker
        public invoke(context, handle, obj, socket?) {


            var fId = parseInt(obj[Protocol.functionId]);
            var fname = isNaN(fId) ? obj[Protocol.functionId] : handle.contract[fId];

            /* browing namespace */
            var ftokens = fname.split('.');
            var func = handle.exports;
            for (var i = 0; i < ftokens.length; i++) {
                if (!func) {
                    console.log('Invoke error', obj[Protocol.functionId] + ' is not a function', '');
                    this.sendResult(socket, obj[Protocol.signatureId], null, 'Invoke error : ' + obj[Protocol.functionId] + ' is not a function');
                    return;
                }
                func = func[ftokens[i]];
            }
            /* ***************** */


            //var func = this.exports[fname];
            if (typeof func != 'function') {
                //socket.send('Invoke error');
                console.log('Invoke error', obj[Protocol.functionId] + ' is not a function', '');
                this.sendResult(socket, obj[Protocol.signatureId], null, 'Invoke error : ' + obj[Protocol.functionId] + ' is not a function');
                return;
            }
            //obj.a.push(conn); //add connection object to arguments



            try {
                obj[Protocol.argsId] = obj[Protocol.argsId] || [];
                var result = func.apply(context, obj[Protocol.argsId]);

                //console.log('sending back result ', result, obj)

                if (socket && obj[Protocol.signatureId] && !context.async) {

                    this.sendResult(socket, obj[Protocol.signatureId], result, null);
                    /*
                    var retObj = {};
                    retObj[Protocol.signatureId] = obj[Protocol.signatureId];
                    retObj[Protocol.resultId] = result;
                    socket.send(JSON.stringify(retObj));
                    */

                }

                obj[Protocol.argsId].unshift(socket);
                if (typeof func.onCall == 'function') func.onCall.apply(context, obj[Protocol.argsId]);
            } catch (ex) {
                console.log('EURECA Invoke exception!! ', ex.stack);
            }

        }
    }

}

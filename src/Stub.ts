
import { EurecaPromise } from "./EurecaPromise";
import { Util } from "./Util.class";
import { Protocol } from "./Protocol.static";
import { InvokeContext } from "./InvokeContext.class";
import { ISocket } from "./ISocket.interface";

/** @ignore */
export class Stub {

    private static callbacks: any = {};
    // Constructor
    constructor(public settings: any = {}) {
    }

    static registerCallBack(sig, cb) {
        this.callbacks[sig] = cb;
    }

    static doCallBack(sig, result, error, socket?: ISocket) {
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
                proxyObj.reject(socket ? `clientId<${socket.id}> : ${error}` : error);
        }
    }


    public invokeRemote(fname: string, importName: string, socket: ISocket, ...args) {

        let defResolve: any;
        let defReject: any;
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
        const RPCObject: any = {};
        RPCObject[Protocol.functionId] = fname;
        RPCObject[Protocol.signatureId] = RPCPromise.sig;
        if (importName) RPCObject[Protocol.contractObjId] = importName;
        if (args.length > 0) RPCObject[Protocol.argsId] = args;

        socket.send(this.settings.serialize(RPCObject));
        return RPCPromise;
    }


    /**
     * Generate proxy functions allowing to call remote functions
     */
    public importRemoteFunction(socket: ISocket, functions, importName: string, filterRx?: RegExp) {
        if (!socket.proxy) socket.proxy = {};
        if (functions === undefined) return;
        if (!Array.isArray(functions)) return;

        for (let fname of functions) {
            if (filterRx && !filterRx.test(fname)) continue;

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
            }
        }

    }



    //invoke exported function and send back the result to the invoker
    public invokeLocal(invokeContext: InvokeContext, handle) {
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

        } catch (ex) {
            console.log('EURECA Invoke exception!! ', ex.stack);
        }

    }
}



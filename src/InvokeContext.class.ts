import { Protocol } from './Protocol.static'
import { ISocket } from './ISocket.interface';

/** @ignore */
export class InvokeContext {
    public async = false;
    public proxy;
    public user;
    public serialize;
    public __erctx__;
    public retId;
    constructor(public socket: ISocket, public message) {
        this.user = { clientId: socket.id };
        this.proxy = socket.proxy;
        this.retId = message[Protocol.signatureId];
        this.__erctx__ = this;
    }
    public return(result, error = null) {
        var retObj = {};
        retObj[Protocol.signatureId] = this.retId;
        retObj[Protocol.resultId] = result;
        retObj[Protocol.errorId] = error;
        this.socket.send(this.serialize(retObj));
    }

    public sendResult(result, error, errorcode=0) {
        if (!this.socket) return;
        const retObj = {};
        retObj[Protocol.signatureId] = this.retId;
        retObj[Protocol.resultId] = result;
        retObj[Protocol.errorId] = error;
        this.socket.send(this.serialize(retObj));
    }



}
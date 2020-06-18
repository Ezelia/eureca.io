
import { EventEmitter } from "../../EventEmitter";
import { ISocket } from "../../ISocket.interface";
import { Util } from "../../Util.class";

/** @ignore */
declare var Primus: any;



export class Socket extends EventEmitter implements ISocket {
    public request;
    public id;
    public eureca: any = { remoteAddress: { ip: undefined, port: undefined, secure: undefined }, origin: undefined };

    public proxy: any;
    public contract: any;
    public context: any;

    constructor(public tSocket?: any) {
        super();
        

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
    public import(name: string = '__default__') {
        if (this.proxy) return this.proxy[name];
        return undefined;
    }

    private bindEvents() {


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


    isAuthenticated(): boolean {
        return this.eureca.authenticated;
    }
    send(data) {
        this.tSocket.write(data);
    }
    close() {
        if (this.tSocket.end) this.tSocket.end();
        else this.tSocket.close();
    }

}


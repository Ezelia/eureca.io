import { EventEmitter } from "../../EventEmitter";
import { ISocket } from "../../ISocket.interface";
import { Util } from "../../Util.class";
import { Peer } from "./Peer";


export class Socket extends EventEmitter implements ISocket {
    public request;
    public id;
    public eureca: any = { remoteAddress: { ip: undefined, port: undefined, secure: undefined }, origin: undefined };

    public proxy: any;
    public contract: any;
    public context: any;

    constructor(public tSocket?: any, public peer?: Peer) {
        super();

        if (peer) peer.tSocket = this;

        this.id = peer && peer.id ? peer.id : Util.randomID();

        if (tSocket && tSocket.request) this.request = tSocket.request;

        this.bindEvents();
    }

    public import(name: string = '__default__') {
        if (this.proxy) return this.proxy[name];
        return undefined;
    }

    public update(socket?: any) {
        if (this.tSocket != null) {
            this.tSocket.onopen = null;
            this.tSocket.onmessage = null;
            this.tSocket.onclose = null;
            this.tSocket.onerror = null;
        }




        this.tSocket = socket;


        this.bindEvents();

    }
    private bindEvents() {
        if (this.tSocket == null) return;





        this.tSocket.onopen = (event) => this.emit('open', event.data);

        this.tSocket.onmessage = (event) => this.emit('message', event.data);

        this.tSocket.onclose = () => this.emit('close');

        this.tSocket.onerror = (error) => this.emit('error', error);



        if (this.peer) {
            this.peer.on('stateChange', (s) => {
                this.emit('stateChange', s);
            });
        }
    }

    isAuthenticated(): boolean {
        return this.eureca.authenticated;
    }
    send(data) {
        if (this.tSocket == null) return;

        this.tSocket.send(data);
    }
    close() {
        this.tSocket.close();
    }

}

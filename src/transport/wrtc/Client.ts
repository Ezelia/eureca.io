import { Socket } from "./Socket";
import { Peer } from "./Peer";


export class Client {
    static create(uri, settings: any = {}) {
        const wrtcSettings = {
            uri,
            retries: settings.retries,
            prefix: settings.prefix,
            ...settings.transportSettings
        }

        const clientPeer: Peer = new Peer(wrtcSettings);
        const tSocket = new Socket(clientPeer.channel, clientPeer);
        clientPeer.remainingRetries = wrtcSettings.retries;



        clientPeer.on('disconnected', () => {
            clientPeer.signal();

        });
        clientPeer.on('timeout', () => {
            clientPeer.signal();
        });


        clientPeer.signal();

        return tSocket;
    }


}

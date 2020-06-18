import { Socket } from "./Socket";
import { Peer } from "./Peer";
import { IServer } from "../../IServer.interface";
import { Util } from "../../Util.class";
import { Protocol } from "../../Protocol.static";


var qs;
if (Util.isNodejs) {
    qs = require('querystring');
}

export class Server implements IServer {
    private processPost(request, response) {
        return new Promise((resolve, reject) => {
            let queryData = "";
            if (request.method == 'POST') {
                request.on('data', (data) => {
                    queryData += data;
                    if (queryData.length > 1e6) {
                        queryData = "";
                        response.writeHead(413, { 'Content-Type': 'text/plain' }).end();
                        request.connection.destroy();
                    }
                });

                request.on('end', () => {
                    request.post = qs.parse(queryData);
                    resolve();
                });

            } else {
                response.writeHead(405, { 'Content-Type': 'text/plain' });
                response.end();
            }
        })
    }
    private serverPeer: Peer = new Peer();
    constructor(public appServer: any, settings: any) {
        const wrtcSettings = {
            retries: settings.retries,
            prefix: settings.prefix,
            ...settings.transportSettings
        }


        let app = appServer;
        if (appServer._events.request !== undefined && appServer.routes === undefined) app = appServer._events.request;

        if (app.get && app.post) {
            app.post('/wrtc-' + wrtcSettings.prefix, (request, response) => {

                if (request.body) //body parser present
                {
                    const offer = request.body[Protocol.signal];
                    this.serverPeer.getOffer(offer, request)
                        .then((pc: RTCPeerConnection) => {
                            const resp = {};
                            resp[Protocol.signal] = pc.localDescription;


                            response.write(JSON.stringify(resp));
                            response.end();
                        });
                    return;
                }
                this.processPost(request, response)
                    .then(() => {
                        const offer = request.post[Protocol.signal];
                        response.writeHead(200, "OK", { 'Content-Type': 'text/plain' });
                        return ({ offer, request })
                    })
                    .then(({ offer, request }) => this.serverPeer.getOffer(offer, request))
                    .then((pc: RTCPeerConnection) => {
                        const resp = {};
                        resp[Protocol.signal] = pc.localDescription;


                        response.write(JSON.stringify(resp));
                        response.end();
                    });

            });

        }

        else {
            //we use POST request for webRTC signaling            
            appServer.on('request', (request, response) => {
                if (request.method === 'POST') {
                    if (request.url.split('?')[0] === '/wrtc-' + wrtcSettings.prefix) {

                        this.processPost(request, response)
                            .then(() => {
                                const offer = request.post[Protocol.signal];
                                response.writeHead(200, "OK", { 'Content-Type': 'text/plain' });
                                return ({ offer, request })
                            })
                            .then(({ offer, request }) => this.serverPeer.getOffer(offer, request))
                            .then((pc: RTCPeerConnection) => {
                                const resp = {};
                                resp[Protocol.signal] = pc.localDescription;


                                response.write(JSON.stringify(resp));
                                response.end();
                            });
                    }
                }
            });
        }

        this.serverPeer.on('stateChange', (s) => {
            this.appServer.eurecaServer.emit('stateChange', s);
        });

    }


    onconnect(callback: (Socket) => void) {

        this.serverPeer.on('datachannel', (datachannel) => {
            const socket = new Socket(datachannel);

            callback(socket);
        });
    }

    static create(hook, settings) {
        try {
            const server = new Server(hook, settings);
            return server;
        }
        catch (ex) {
        }
    }

}


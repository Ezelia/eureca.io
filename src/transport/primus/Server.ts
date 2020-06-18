

import { Util } from "../../Util.class";
import { Socket } from "./Socket";
import { IServer } from "../../IServer.interface";
import { Transport } from "../../Transport";

/** @ignore */
declare var Primus: any;



if (Util.isNodejs) {
    var PrimusNode = require('primus');
}

export class Server implements IServer {

    constructor(public primus: any) {
    }
    //on client connect
    onconnect(callback: (Socket) => void) {
        this.primus.on('connection', function (psocket) {

            //encapsulate Primus socket into eureca socket object
            const socket = new Socket(psocket)
            //Eureca.Util.extend(iosocket, socket);
            callback(socket);
        });
    }

    static create(hook, settings: any = {}) {
        const primusSettings = {
            pathname: settings.prefix,
            transformer: settings.transport,
            ...settings.transportSettings
        }

        try {

            var primus = new PrimusNode(hook, primusSettings);


            var primusTransport = Transport.get(settings.transport);
            //populate the client script
            primusTransport.script = primus.library();
            var server = new Server(primus);

            if (settings.cookies)
                primus.use('cookies', settings.cookies);

            if (settings.session)
                primus.use('session', settings.session);

            return server;
        }
        catch (ex) {
            if (ex.name == 'PrimusError' && ex.message.indexOf('Missing dependencies') == 0) {
                console.error('Missing ', primusSettings.transformer);
                process.exit();
            }
            else {
                throw ex;
            }
        }
    }

}

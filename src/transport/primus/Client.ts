import { Util } from "../../Util.class";
import { Socket } from "./Socket";

/** @ignore */
declare var Primus: any;

if (Util.isNodejs) {
    //if we are in a nodejs context, override the global variable "Primus"
    var PrimusNode = require('primus');
}

export class Client {
    static create(uri, settings: any = {}) {
        const primusSettings = {
            pathname: settings.prefix,
            transformer: settings.transport,
            ...settings.transportSettings
        }

        var pSocket;
        if (Util.isNodejs) {

            var CSocket = PrimusNode.createSocket(primusSettings);
            pSocket = new CSocket(uri);

        } else {

            pSocket = new Primus(uri, primusSettings);
        }



        return new Socket(pSocket);
    }

}

import { Transport } from "../../Transport";
import { Client } from "./Client";
import { Server } from "./Server";


const deserialize = (message) => {
    var jobj;
    if (typeof message != 'object') {
        try {
            jobj = JSON.parse(message);
        } catch (ex) { };
    }
    else {
        jobj = message;
    }
    return jobj;
}

const serialize = JSON.stringify;


export function register() {
    Transport.register('wrtc', '', Client.create, Server.create, serialize, deserialize);
    Transport.register('webrtc', '', Client.create, Server.create, serialize, deserialize);
}

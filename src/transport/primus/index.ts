import { Transport } from "../../Transport";
import { Client } from "./Client";
import { Server } from "./Server";



    export function register() {
        //set empty client script by default, it'll be populated by createServer function
        Transport.register(
            'engine.io', '',
            Client.create, Server.create
        );
        Transport.register(
            'ws', '',
            Client.create, Server.create
        );
        Transport.register(
            'sockjs', '',
            Client.create, Server.create
        );
        Transport.register(
            'faye', '',
            Client.create, Server.create
        );
        Transport.register(
            'uws', '',
            Client.create, Server.create
        );
        Transport.register(
            'websockets', '',
            Client.create, Server.create
        );
        Transport.register(
            'browserchannel', '',
            Client.create, Server.create
        );
    }

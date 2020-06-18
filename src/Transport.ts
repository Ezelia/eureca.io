import { IServer } from "./IServer.interface";
import { ISocket } from "./ISocket.interface";


export class Transport {
    public static _transports: any = {};

    public static register(
        name: string,
        clientScript: string,
        createClient: (uri: string, options?: any) => ISocket,
        createServer: (hook: any, options?: any) => IServer,
        defaultSerializer?: (data: any) => any,
        defaultDeserializer?: (data: any) => any
    ): boolean {
        if (Transport._transports[name] !== undefined) return false;

        Transport._transports[name] = {
            createClient: createClient,
            createServer: createServer,
            script: clientScript,
            serialize: defaultSerializer,
            deserialize: defaultDeserializer
        }
        return true;
    }
    public static get(name) {
        if (!Transport._transports[name])
            throw new Error('Unknown transport ' + name);

        return Transport._transports[name];
    }

}
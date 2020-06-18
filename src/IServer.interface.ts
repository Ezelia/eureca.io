import { ISocket } from "./ISocket.interface";


export interface IServer {
    // Instance member
    onconnect(callback: (socket:ISocket) => void);
}

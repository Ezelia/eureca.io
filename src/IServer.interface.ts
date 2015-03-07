/// <reference path="ISocket.interface.ts" />

/** @ignore */
module Eureca {

    export interface IServer {
        // Instance member
        onconnect(callback: (ISocket) => void );
    }

}

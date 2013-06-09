/// <reference path="ISocket.interface.ts" />

module Eureca {

    export interface IServer {
        // Instance member
        onconnect(callback: (ISocket) => void );
    }

}

module Eureca {


    /**
     * Eureca ISocket interface
     * @interface ISocket
     */
    export interface ISocket {
        id: any;
        eureca: any;

        // Instance member
        send(data: any);
        close();

        onopen(callback: (any?) => void );
        onmessage(callback: (any?) => void );
        ondisconnect(callback: (any?) => void );
        onclose(callback: (any?) => void );
        onerror(callback: (any?) => void );
    }

}

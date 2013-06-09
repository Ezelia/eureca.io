module Eureca {

    export interface ISocket {
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

module Eureca {


    /**
     * Represents a client socket in the server side <br />
     * When a new client is connected, a socket is instantiated in the server side allowing the server to exchange data with that client <br />
     * In most use cases you don't need to handle this socket directly <br />
     * but if you want to implement your own protocole on top of eureca.io you can use this interface to handle raw data.<br />
     * 
     * @interface ISocket
     * 
     * 
     * @example
     * // <h3>Server side</h3>
     * var server = new Eureca.Server();
     * server.on('connect', function(socket) {
     *      socket.send('my raw data');
     * });
     * 
     * <br />
     * 
     * @example
     * // <h3>Client side</h3>
     * 
     * var client = new Eureca.Client();
     * 
     * // See <b>@[ {@link Client#event:unhandledMessage|unhandledMessage event} ]</b>
     * 
     * client.on('unhandledMessage', function (data) {
     *    console.log(data); // prints : "my raw data"
     * });
     * 
     * 
     */
    export interface ISocket {
        id: any;
        eureca: any;

        /**
         * Send user data to the client bound to this socket
         * 
         * @function ISocket#send
         * @param {any} rawData - data to send (must be serializable type)
         */
        send(data: any);


        close();


        isAuthenticated(): boolean;

        onopen(callback: (any?) => void );
        onmessage(callback: (any?) => void );
        ondisconnect(callback: (any?) => void );
        onclose(callback: (any?) => void );
        onerror(callback: (any?) => void );
    }

}

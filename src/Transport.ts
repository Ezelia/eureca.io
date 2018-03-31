/// <reference path="ISocket.interface.ts" />
/// <reference path="IServer.interface.ts" />

/** @ignore */
module Eureca {
    
    // Class
    export class Transport {
        private static transports: any = {};
        static register(
            name, 
            clientScript:string, 
            createClient: (uri: string, options?: any) => ISocket, 
            createServer: (hook: any, options?: any) => IServer,
            defaultSerializer : (data:any) => any,
            defaultDeserializer : (data:any) => any
        ):boolean
        {
            if (this.transports[name] !== undefined) return false;

            this.transports[name] = {
                createClient: createClient,
                createServer: createServer,
                script:clientScript,
                serialize:defaultSerializer,
                deserialize:defaultDeserializer
            }
        }
        static get (name)
        {
            if (name != 'webrtc')
            {
                //console.log('* using primus:' + name);
                //settings.transport =  'primus';
                return this.transports['primus'];                
            }
            else
            {
                //console.log('* using ' + name);   
                return this.transports[name];
            }

            
        }
    }
}


/** @ignore */
module Eureca {
    export class Protocol {
        //internal stuff
        static contractId = '__eureca__';
        

        static authReq = '__auth__';
        static authResp = '__authr__';
        static signal = '__signal__';
        static signalACK = '__sigack__';

        //RPC stuff
        static functionId = 'f';
        static argsId = 'a';
        static resultId = 'r';
        static signatureId = '_r';        
    }
}
/** @ignore */
declare var exports: any;

/** @ignore */
module Eureca {

    // Class
    export class Util {
        static isNodejs = (typeof exports == 'object' && exports);
        //Borrowed from RMI.js https://github.com/mmarcon/rmi.js
        static randomStr(length:number = 10) {
            let text = '';
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for(let i = 0; i < length; i++) {
                text += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return text;
        }
    }

}

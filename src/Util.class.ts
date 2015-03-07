/** @ignore */
declare var exports: any;

/** @ignore */
module Eureca {

    // Class
    export class Util {
        static isNodejs = (typeof exports == 'object' && exports);
        static extend(target, extension) {
            if (target && extension) {
                for (var key in extension)
                    target[key] = extension[key];
            }
        }
        //Borrowed from RMI.js https://github.com/mmarcon/rmi.js
        static randomStr(length:number = 10) {
            var rs, i, nextIndex, l, chars = [
                'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
                'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
                '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
            
            rs = '';
            for (i = 0; i < length; i++) {
                nextIndex = Math.floor(Math.random() * chars.length);
                rs += chars[nextIndex];
            }
            return rs;
        }
    }

}

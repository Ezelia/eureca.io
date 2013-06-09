var Eureca;
(function (Eureca) {
    // Class
    var Util = (function () {
        function Util() { }
        Util.isNodejs = (typeof exports == 'object' && exports);
        Util.extend = function extend(target, extension) {
            if(target && extension) {
                for(var key in extension) {
                    target[key] = extension[key];
                }
            }
        };
        Util.randomStr = //Borrowed from RMI.js https://github.com/mmarcon/rmi.js
        function randomStr(length) {
            if (typeof length === "undefined") { length = 10; }
            var rs, i, nextIndex, l, chars = [
                'a', 
                'b', 
                'c', 
                'd', 
                'e', 
                'f', 
                'g', 
                'h', 
                'i', 
                'j', 
                'k', 
                'l', 
                'm', 
                'n', 
                'o', 
                'p', 
                'q', 
                'r', 
                's', 
                't', 
                'u', 
                'v', 
                'w', 
                'x', 
                'y', 
                'z', 
                'A', 
                'B', 
                'C', 
                'D', 
                'E', 
                'F', 
                'G', 
                'H', 
                'I', 
                'J', 
                'K', 
                'L', 
                'M', 
                'N', 
                'O', 
                'P', 
                'Q', 
                'R', 
                'S', 
                'T', 
                'U', 
                'V', 
                'W', 
                'X', 
                'Y', 
                'Z', 
                '1', 
                '2', 
                '3', 
                '4', 
                '5', 
                '6', 
                '7', 
                '8', 
                '9', 
                '0'
            ];
            rs = '';
            for(i = 0; i < length; i++) {
                nextIndex = Math.floor(Math.random() * chars.length);
                rs += chars[nextIndex];
            }
            return rs;
        };
        return Util;
    })();
    Eureca.Util = Util;    
})(Eureca || (Eureca = {}));
//@ sourceMappingURL=Util.class.js.map

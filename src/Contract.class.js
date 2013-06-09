var Eureca;
(function (Eureca) {
    var Contract = (function () {
        function Contract() {
        }
        Contract.handlerMaker = function handlerMaker(obj, contract) {
            return {
                getOwnPropertyDescriptor: function (name) {
                    var desc = Object.getOwnPropertyDescriptor(obj, name);
                    if(desc !== undefined) {
                        desc.configurable = true;
                    }
                    return desc;
                },
                getPropertyDescriptor: function (name) {
                    var desc = (Object).getPropertyDescriptor(obj, name);
                    if(desc !== undefined) {
                        desc.configurable = true;
                    }
                    return desc;
                },
                getOwnPropertyNames: function () {
                    return Object.getOwnPropertyNames(obj);
                },
                getPropertyNames: function () {
                    return (Object).getPropertyNames(obj);
                },
                defineProperty: function (name, desc) {
                    Object.defineProperty(obj, name, desc);
                },
                delete: function (name) {
                    return delete obj[name];
                },
                fix: function () {
                    if(Object.isFrozen(obj)) {
                        var result = {
                        };
                        Object.getOwnPropertyNames(obj).forEach(function (name) {
                            result[name] = Object.getOwnPropertyDescriptor(obj, name);
                        });
                        return result;
                    }
                    return undefined;
                },
                has: function (name) {
                    return name in obj;
                },
                hasOwn: function (name) {
                    return ({
                    }).hasOwnProperty.call(obj, name);
                },
                get: function (receiver, name) {
                    return obj[name];
                },
                set: function (receiver, name, val) {
                    console.log('    Contract +=', name);
                    contract.push(name);
                    obj[name] = val;
                    return true;
                },
                enumerate: function () {
                    var result = [];
                    for(var name in obj) {
                        result.push(name);
                    }
                    ;
                    return result;
                },
                keys: function () {
                    return Object.keys(obj);
                }
            };
        };
        Contract.proxify = function proxify(target, contract) {
            if(typeof Proxy == 'undefined') {
                return target;
            }
            return Proxy.create((Contract).handlerMaker(target, contract));
        };
        Contract.parseNS = function parseNS(target, ns, parent) {
            if (typeof ns === "undefined") { ns = []; }
            if (typeof parent === "undefined") { parent = ''; }
            for(var prop in target) {
                if(typeof target[prop] == 'function') {
                    ns.push(parent + prop);
                } else {
                    Contract.parseNS(target[prop], ns, parent + prop + '.');
                }
            }
            return ns;
        };
        Contract.ensureContract = function ensureContract(target, contract) {
            var contract = this.parseNS(target);
            return contract;
        };
        return Contract;
    })();
    Eureca.Contract = Contract;    
})(Eureca || (Eureca = {}));
exports.Eureca = Eureca;
//@ sourceMappingURL=Contract.class.js.map

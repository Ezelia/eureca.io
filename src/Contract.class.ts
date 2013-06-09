declare var exports: any;
declare var Proxy: any;

module Eureca {
    export class Contract {
        // Constructor
        constructor() { }
        static handlerMaker(obj, contract) {
            return {
                getOwnPropertyDescriptor: function (name) {
                    var desc = Object.getOwnPropertyDescriptor(obj, name);
                    // a trapping proxy's properties must always be configurable
                    if (desc !== undefined) { desc.configurable = true; }
                    return desc;
                },
                getPropertyDescriptor: function (name) {
                    var desc = (<any>Object).getPropertyDescriptor(obj, name); // not in ES5
                    // a trapping proxy's properties must always be configurable
                    if (desc !== undefined) { desc.configurable = true; }
                    return desc;
                },
                getOwnPropertyNames: function () {
                    return Object.getOwnPropertyNames(obj);
                },
                getPropertyNames: function () {
                    return (<any>Object).getPropertyNames(obj);                // not in ES5
                },
                defineProperty: function (name, desc) {
                    Object.defineProperty(obj, name, desc);
                },
                delete: function (name) { return delete obj[name]; },
                fix: function () {
                    if (Object.isFrozen(obj)) {
                        var result = {};
                        Object.getOwnPropertyNames(obj).forEach(function (name) {
                            result[name] = Object.getOwnPropertyDescriptor(obj, name);
                        });
                        return result;
                    }
                    // As long as obj is not frozen, the proxy won't allow itself to be fixed
                    return undefined; // will cause a TypeError to be thrown
                },

                has: function (name) { return name in obj; },
                hasOwn: function (name) { return ({}).hasOwnProperty.call(obj, name); },
                get: function (receiver, name) { return obj[name]; },
                set: function (receiver, name, val) {
                    console.log('    Contract +=', name);
                    contract.push(name);
                    obj[name] = val;
                    return true;
                }, // bad behavior when set fails in non-strict mode
                enumerate: function () {
                    var result = [];
                    for (var name in obj) { result.push(name); };
                    return result;
                },
                keys: function () { return Object.keys(obj); }

            };
        }
        static proxify(target, contract): any {
            if (typeof Proxy == 'undefined') return target;
            //ELog.log('I', 'Harmony proxy', 'Enabled');
            return Proxy.create((<any>Contract).handlerMaker(target, contract));
        }

        static parseNS(target, ns?:string[]=[], parent?:string='')
        {            
            for (var prop in target) {
                //console.log('parsing prop', parent+prop, typeof target[prop]);
                if (typeof target[prop] == 'function') {
                    ns.push(parent + prop);
                }
                else
                {
                    parseNS(target[prop], ns, parent + prop + '.');
                }
                //contract.push(prop);
            }
            return ns;
        }
        static ensureContract(target, contract) {
            var contract = this.parseNS(target);
            //console.log('ns = ', contract);
            /*
            if (typeof Proxy == 'undefined') {
                contract = [];
                for (var prop in target) {
                    contract.push(prop);
                }
            }
            */
            return contract;
            
            
        }
    }

}

exports.Eureca = Eureca;
/** @ignore */
export class Contract {
    // Constructor
    constructor() { }

    static parseNS(target, ns: string[] = [], parent: string = '') {
        for (let prop in target) {
            //console.log('parsing prop', parent+prop, typeof target[prop]);
            if (typeof target[prop] == 'function') {
                ns.push(parent + prop);
            }
            else {
                //FIXME : will crash if sub NS has no children : example : exports.id = 'hello'

                Contract.parseNS(target[prop], ns, parent + prop + '.');
            }
            //contract.push(prop);
        }


        //handle instances
        if (target && target.constructor && target.constructor.name !== 'Object') {
            const proto = Object.getPrototypeOf(target);
            const props = Object.getOwnPropertyNames(proto)
                                .filter(p => p !== 'constructor');

            for (let prop of props) {
                //console.log('parsing prop', parent+prop, typeof target[prop]);
                if (typeof proto[prop] == 'function') {
                    ns.push(parent + prop);
                }
                else {
                    //FIXME : will crash if sub NS has no children : example : exports.id = 'hello'
                    Contract.parseNS(proto[prop], ns, parent + prop + '.');
                }
                //contract.push(prop);
            }
        }

        return ns;
    }

    static ensureContract(target) {

        // if (typeof Proxy == 'function') //detected JS Proxy, we can set up dynamic handling of exports 
        // {

        // }


        var contract: any = this.parseNS(target);


        
        return contract;


    }
}

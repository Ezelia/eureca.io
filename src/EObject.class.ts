/** @ignore */
module Eureca {
    export class EObject {
        _events: any;
        constructor() {
        }

        // Dynamic extend
        extend(options) {
            if (options) {
                for (var key in options)
                    this[key] = options[key];
            }
        }

        // Events primitives ======================
        bind(event, fct) {
            this._events = this._events || {};
            this._events[event] = this._events[event] || [];
            this._events[event].push(fct);
        }
        on(event, fct) {
            this._events = this._events || {};
            this._events[event] = this._events[event] || [];
            this._events[event].push(fct);
        }
        unbind(event, fct) {
            this._events = this._events || {};
            if (event in this._events === false) return;
            this._events[event].splice(this._events[event].indexOf(fct), 1);
        }
        unbindEvent(event) {
            this._events = this._events || {};
            this._events[event] = [];
        }
        unbindAll() {
            this._events = this._events || {};
            for (var event in this._events) this._events[event] = false;
        }
        trigger(event, ...args: any[]) {
            this._events = this._events || {};
            if (event in this._events === false) return;
            for (var i = 0; i < this._events[event].length; i++) {
                this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1))
            }
        }
        registerEvent(evtname:string) {
            this[evtname] = function (callback, replace) {

                if (typeof callback == 'function') {
                    if (replace) this.unbindEvent(evtname);

                    this.bind(evtname, callback);
                }

                return this;
            }
        }
        registerEvents(eventsArray: string[]) {
            for (var i = 0; i < eventsArray.length; i++)
                this.registerEvent(eventsArray[i]);
        }
        // ====================================================================================

    }

}
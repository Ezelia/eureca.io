var Eureca;
(function (Eureca) {
    var EObject = (function () {
        function EObject() {
        }
        EObject.prototype.extend = // Dynamic extend
        function (options) {
            if(options) {
                for(var key in options) {
                    this[key] = options[key];
                }
            }
        };
        EObject.prototype.bind = // Events primitives ======================
        function (event, fct) {
            this._events = this._events || {
            };
            this._events[event] = this._events[event] || [];
            this._events[event].push(fct);
        };
        EObject.prototype.unbind = function (event, fct) {
            this._events = this._events || {
            };
            if(event in this._events === false) {
                return;
            }
            this._events[event].splice(this._events[event].indexOf(fct), 1);
        };
        EObject.prototype.unbindEvent = function (event) {
            this._events = this._events || {
            };
            this._events[event] = [];
        };
        EObject.prototype.unbindAll = function () {
            this._events = this._events || {
            };
            for(var event in this._events) {
                this._events[event] = false;
            }
        };
        EObject.prototype.trigger = function (event) {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                args[_i] = arguments[_i + 1];
            }
            this._events = this._events || {
            };
            if(event in this._events === false) {
                return;
            }
            for(var i = 0; i < this._events[event].length; i++) {
                this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
            }
        };
        EObject.prototype.registerEvent = function (evtname) {
            this[evtname] = function (callback, replace) {
                if(typeof callback == 'function') {
                    if(replace) {
                        this.unbindEvent(evtname);
                    }
                    this.bind(evtname, callback);
                }
                return this;
            };
        };
        EObject.prototype.registerEvents = function (eventsArray) {
            for(var i = 0; i < eventsArray.length; i++) {
                this.registerEvent(eventsArray[i]);
            }
        };
        return EObject;
    })();
    Eureca.EObject = EObject;    
    // ====================================================================================
    })(Eureca || (Eureca = {}));
//@ sourceMappingURL=EObject.class.js.map

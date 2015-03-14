var express = require('express')
  , app = express(app)
  , server = require('http').createServer(app);
var EurecaServer = require('../../').EurecaServer;

var transportName = 'engine.io';

var eurecaServer = new EurecaServer({ transport: transportName });
eurecaServer.attach(server);

//functions under "exports" namespace will
//be exposed to client side
eurecaServer.exports.foo = function () {
    return 'bar';
}
eurecaServer.exports.add = function (a, b) {
    return a+b;
}

eurecaServer.exports.hello = function () {
    console.log('Hello world!');
}

//see browser client side code for index.html content
app.get('/', function (req, res, next) {
    res.sendfile('index.html');
});
var EurecaClient = require('../../').EurecaClient;


var ready = false;
var clientProxy = undefined;

function whenClientReady(callback)
{
    var itv = setInterval(function () {
        if (!ready) return;
        clearInterval(itv);
        callback();

    }, 100);
}
var tests = [];
//tests.push(1);


describe("Server side", function () {
    it("should detect client connection", function () {
        var flag, id, client;
        runs(function () {            
            tests.push(1);
            flag = false;
            client = new EurecaClient({ transport: transportName, autoConnect: true, uri: 'http://localhost:8000/', prefix: 'eureca.io', retry: 3 });
            eurecaServer.onConnect(function (conn) {
                flag = true;
                id = conn.id;                
            });
        });
        waitsFor(function () {
            return flag;
        }, "The Value should be incremented", 1000);
        runs(function () {
            tests.pop();            
            console.log('conn Id = ', id);
            expect(id).not.toBe(undefined);
            client.disconnect();
        });
    });
    
    it("should detect client called function", function () {
        var flag, id;
        runs(function () {
            tests.push(1);
            flag = false;
            eurecaServer.exports.foo.onCall = function (conn) {
                console.log('Client %s called foo()', conn.id);
                flag = true;
                id = conn.id;
            }
            var client2 = new EurecaClient({ transport: transportName, uri: 'http://localhost:8000/', prefix: 'eureca.io', retry: 3 });
            client2.ready(function (proxy) {
                proxy.foo().onReady(function () {
                    client2.disconnect();
                });
            });

        });
        waitsFor(function () {
            return flag;
        }, "The Value should be incremented", 1000);
        runs(function () {
            tests.pop();
            console.log('conn Id = ', id);
            expect(id).not.toBe(undefined);
        });
    });
    it("should get remoteAddress", function () {
        var flag, ip;
        runs(function () {
            tests.push(1);
            flag = false;
            eurecaServer.exports.foo2 = function () {
                var conn = this.connection;
                console.log('Client %s called foo()', conn.id);
                flag = true;
                
                console.log('Eureca Object = ', conn.eureca);
                ip = conn.eureca.remoteAddress;
            }

            var client2 = new EurecaClient({ transport: transportName, uri: 'http://localhost:8000/', prefix: 'eureca.io', retry: 3 });
            client2.ready(function (proxy) {
                proxy.foo2().onReady(function () {                    
                    client2.disconnect();
                });
            });

        });
        waitsFor(function () {
            return flag;
        }, "The Value should be incremented", 1000);
        runs(function () {
            tests.pop();
            console.log('Client IP = ', ip);
            expect(ip).not.toBe(undefined);
        });
    });
});


describe("Client -> Server ", function () {
    var client;
    it("should connect to server", function () {
        runs(function () {
            tests.push(1);
            client = new EurecaClient({ transport: transportName, autoConnect: false, uri: 'http://localhost:8000/', prefix: 'eureca.io', retry: 3 });
            client.connect();
            client.ready(function (proxy) {
                ready = true;
                clientProxy = proxy
            });
        });
        waitsFor(function () {
            return ready;
        }, "The Value should be incremented", 1000);
        runs(function () {
            tests.pop();
            expect(clientProxy).not.toBe(undefined);
        });
    });

    it("should call remote function", function () {
        var value, flag;
        runs(function () {
            tests.push(1);
            flag = false;
            value = '#####';
            whenClientReady(function () {
                clientProxy.hello().onReady(function (r) {
                    flag = true;
                    value = r;
                    console.log('R = ', r);
                });
            });
        });
        waitsFor(function () {
            return ready && flag;
        }, "The Value should be incremented", 1000);
        runs(function () {
            tests.pop();
            expect(value).toBe(undefined);
        });
    });
    
    it("should trigger onMessage", function () {
        var value, flag;
        runs(function () {
            tests.push(1);
            flag = false;
            value = '';
            whenClientReady(function () {
                client.onMessage(function (msg) {
                    console.log(' MSG = ', msg);
                    value = msg;
                    flag = true;
                });
                clientProxy.foo();
            });
        });
        waitsFor(function () {
            return ready && flag;
        }, "The Value should be incremented", 1000);
        runs(function () {
            tests.pop();
            expect(value).not.toBe('');
        });
    });
    
    it("should call remote function and get back result", function () {
        var value, flag;
        runs(function () {
            tests.push(1);
            flag = false;
            value = '';
            whenClientReady(function () {
                clientProxy.foo().onReady(function (r) {
                    flag = true;
                    value = r;
                    console.log('R = ', r);
                });
            });
        });
        waitsFor(function() {
            return ready && flag;
        }, "The Value should be incremented", 1000);
        runs(function () {
            tests.pop();
            expect(value).toBe('bar');            
        });
    });

    
    it("should close connection", function () {
        var disconnected;
        runs(function () {
            disconnected = false;
            whenClientReady(function () {
                var itv = setInterval(function () {
                    if (tests.length > 0) return;
                    clearInterval(itv);
                    eurecaServer.on('disconnect', function () {
                        
                        disconnected = true;


                        console.log('server received disconnect message ... closing process in 1sec');
                        server.close();

                        setTimeout(function () {
                            process.exit();
                        }, 1000);
                    });


                    client.disconnect();
                    

                }, 100);
            });
        });
        waitsFor(function () {
            return disconnected;
        }, "The Value should be incremented", 1000);
        runs(function () {
            expect(disconnected).toBe(true);            
        });
    });
});

server.listen(8000);


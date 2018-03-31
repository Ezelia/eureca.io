var express = require('express')
  , app = express(app)
  , server = require('http').createServer(app);
var Eureca = require('../');

var transportName = 'engine.io';

var eurecaServer = new Eureca.Server({ transport: transportName });
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
//var EurecaClient = require('../../').EurecaClient;


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
    it("should detect client connection", function (done) {
		
		
        var flag, client;
                
            tests.push(1);
            flag = false;
            client = new Eureca.Client({ transport: transportName, autoConnect: true, uri: 'http://localhost:8000/', prefix: 'eureca.io', retry: 3 });
            eurecaServer.onConnect(function (conn) {
                flag = true;
                              
				
				tests.pop();            
				console.log('conn Id = ', conn.id);
				expect(conn.id).not.toBe(undefined);
				client.disconnect();
				done();
            });
		
		
    });
    
    it("should detect client called function", function (done) {
        var flag, id;
        
            tests.push(1);
            flag = false;
            eurecaServer.exports.foo.onCall = function (conn) {
                console.log('Client %s called foo()', conn.id);
                flag = true;
                id = conn.id;
				
				
				tests.pop();
				console.log('conn Id = ', id);
				expect(id).not.toBe(undefined);
				done();
            }
            var client2 = new Eureca.Client({ transport: transportName, uri: 'http://localhost:8000/', prefix: 'eureca.io', retry: 3 });
            client2.ready(function (proxy) {
                proxy.foo().onReady(function () {
                    client2.disconnect();
                });
            });


    });
    it("should get remoteAddress", function (done) {
        var flag, ip;
        
            tests.push(1);
            flag = false;
            eurecaServer.exports.foo2 = function () {
                var conn = this.connection;
                console.log('Client %s called foo()', conn.id);
                flag = true;
                
                console.log('Eureca Object = ', conn.eureca);
                ip = conn.eureca.remoteAddress;
				
				tests.pop();
				console.log('Client IP = ', ip);
				expect(ip).not.toBe(undefined);

				done();
            }

            var client2 = new Eureca.Client({ transport: transportName, uri: 'http://localhost:8000/', prefix: 'eureca.io', retry: 3 });
            client2.ready(function (proxy) {
                proxy.foo2().onReady(function () {                    
                    client2.disconnect();
                });
            });


    });
});


describe("Client -> Server ", function () {
    var client;
    it("should connect to server", function (done) {
        
            tests.push(1);
            client = new Eureca.Client({ transport: transportName, autoConnect: false, uri: 'http://localhost:8000/', prefix: 'eureca.io', retry: 3 });
            client.connect();
            client.ready(function (proxy) {
                ready = true;
                clientProxy = proxy
				
				tests.pop();
				expect(clientProxy).not.toBe(undefined);	
				done();			
            });

    });

    it("should call remote function", function (done) {
        var value, flag;
        
            tests.push(1);
            flag = false;
            value = '#####';
            whenClientReady(function () {
                clientProxy.hello().onReady(function (r) {
                    flag = true;
                    value = r;
                    console.log('R = ', r);
					
					tests.pop();
					expect(value).toBe(undefined);		
					done();					
                });
            });

    });
    
    it("should trigger onMessage", function (done) {
        var value, flag;
        
            tests.push(1);
            flag = false;
            value = '';
            whenClientReady(function () {
                client.onMessage(function (msg) {
                    console.log(' MSG = ', msg);
                    value = msg;
                    flag = true;
					
					tests.pop();
					expect(value).not.toBe('');		
					done();					
                });
                clientProxy.foo();
            });

    });
    
    it("should call remote function and get back result", function (done) {
        var value, flag;
        
            tests.push(1);
            flag = false;
            value = '';
            whenClientReady(function () {
                clientProxy.foo().onReady(function (r) {
                    flag = true;
                    value = r;
                    console.log('R = ', r);
					
					tests.pop();
					expect(value).toBe('bar');      
					done(); 					
                });
            });

    });

    
    it("should close connection", function (done) {
        var disconnected;
        
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
						
						done();
						expect(disconnected).toBe(true);  
                    });


                    client.disconnect();
                    

                }, 100);
            });

    });
});

server.listen(8000);


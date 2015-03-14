/// <reference path="../Ezelia/EurecaServer.class.js" />

var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  

var Eureca = require('../../');

var eurecaServer = new Eureca.Server({ allow: ['sub', 'ns.hello', 'ns2.ns3.h2'], debuglevel: 4 });

eurecaServer.attach(server);

eurecaServer.onMessage(function (msg) {
    console.log('RECV', msg);
});
eurecaServer.onConnect(function (conn) {
    
    console.log('new Client');
    var client = conn.clientProxy;
    
    client.ns.hello();
    client.ns2.ns3.h2();

    
    client.sub(10, 4).onReady(function (r) {
        console.log('> 10 - 4 = ', r);
    });
    
});

eurecaServer.exports.ns = {
    v: 5,
    ar : [1,2,3],
    play: function ()
    {
        console.log('play');
    },
    stop: function ()
    {
        console.log('stop');
    }
}


eurecaServer.exports.foo = function () {
    return ('bar');
}
//onCall is triggered on the server side when a client calls foo()
eurecaServer.exports.foo.onCall = function(conn)
{
    console.log('Client called foo', conn.id);
}


eurecaServer.exports.add = function (a, b) {
    console.log('add', this.user, this.somevar);
    return a+b;
}



app.get('/', function (req, res, next) {
    res.sendfile(__dirname+'/index.html');
});


server.listen(process.env.PORT || 8000, function () {
    console.log('\033[96mlistening on localhost:8000 \033[39m');
});

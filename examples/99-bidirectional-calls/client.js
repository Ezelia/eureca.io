var Eureca = require('../../');

var client = new Eureca.Client({ uri: 'http://localhost:8000/', prefix: 'eureca.io', retry:3 /*, useIndexes:true*/ });

client.ready(function (proxy) {

    //console.log('> proxy = ', proxy);
    proxy.foo().onReady(function (r) {
        console.log('>', r);
    });

    proxy.ns.play();

    setTimeout(function () {
        proxy.ns.stop();
    }, 1000);
});
client.onMessage(function (msg) {
    console.log(' MSG = ', msg);

});
client.exports = {
    sub: function(a, b)
    {
        return a - b;
    },
    ns: {
        hello: function () {
            console.log('Hello');
        }
    },
    ns2: {
        ns3: {
            h2: function () {
                console.log('h2');
            }
        }
       }
    
}



client.onConnect(function (socket) {
    console.log('onConnect');

});

client.onDisconnect(function (socket) {
    console.log('onDisconnect');

});
client.onError(function (e) {
    console.log('onError', e);

});
client.onConnectionLost(function (socket) {
    console.log('onConnectionLost 2');
    //process.exit();
});
client.onConnectionRetry(function (socket) {
    console.log('onConnectionRetry');

});
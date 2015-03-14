var Eureca = require('../../');

var client = new Eureca.Client({ uri: 'ws://localhost:8000/' });

client.ready(function (proxy) {

    proxy.hello();

});

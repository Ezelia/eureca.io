var Eureca = require('../../');
var client = new Eureca.Client({ uri: 'ws://localhost:8000/', prefix: 'eureca.io', retry: 3 });

client.ready(function (proxy) {

    proxy.hello();
    
});
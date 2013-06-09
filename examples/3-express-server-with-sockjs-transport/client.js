var EurecaClient = require('../../').EurecaClient;
var client = new EurecaClient({ uri: 'ws://localhost:8000/', prefix: 'eureca.io', transport: 'sockjs' });

client.ready(function (proxy) {

    proxy.hello();
    
});
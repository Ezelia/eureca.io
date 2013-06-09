var EurecaClient = require('../../').EurecaClient;
var client = new EurecaClient({ uri: 'http://localhost:8000/', prefix: 'eureca.io', retry: 3 });

client.ready(function (proxy) {

    proxy.hello();
    
});
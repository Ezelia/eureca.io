var Eureca = require('../../');

var client = new Eureca.Client({ uri: 'ws://localhost:8000/', prefix: 'eureca.io', retry: 3 });


console.log('sending invalid auth token');
client.authenticate('KO');


setTimeout(function () {
    console.log('sending valid auth token');
    client.authenticate('OK');
}, 2000);

client.ready(function (proxy) {
    proxy.hello();
    
    
});

client.on('authResponse',function (error) {

    if (error == null) {
        console.log('Auth success');
    }
    else {
        console.log('onAuthResponse ', error);
    }

});

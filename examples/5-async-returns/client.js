var Eureca = require('../../');
var client = new Eureca.Client({ uri: 'ws://localhost:8000/', prefix: 'eureca.io', retry: 3 });

client.ready(function (proxy) {

    proxy.asyncServerHello()
		.onReady(function(r) {
			console.log('server responded : ', r);
		});
    
});

client.exports.asyncClientHello = function () {
	var context = this;
	context.async = true;

	setTimeout(function() {
		
		context.return('Async hello from client');	
	}, 2000);

}
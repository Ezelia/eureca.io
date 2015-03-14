var Eureca = require('../../');

var client = new Eureca.Client({ uri: 'http://localhost:8000/', transport: 'webrtc', reliable: false, maxRetransmits: 3, ordered: true });

client.exports.hello = function() {
    console.log('hello from server');
}

client.exports.sub = function(a, b) {
	return a - b;
}
client.ready(function (proxy) {

    proxy.hello().onReady(function(r) {
	    console.log('returned ', r);
	});
});

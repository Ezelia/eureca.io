var app = require('koa')();
var serve = require('koa-static');
var Eureca = require('eureca.io');
var router = require('koa-router')();

var eurecaServer = new Eureca.Server({allow: ['clientHello']});
var client;
eurecaServer.exports.serverHello = function() {
    console.log('client called server hello');
    return 'hello from server';
};

eurecaServer.exports.clientReady = function() {
    client = this.clientProxy;
    return 'server got client ready';
    client.clientHello().onReady(function(result) {
        console.log('server got from client:' + result);
    });
};
router.get('/projects', function *(next) {
    this.body = {
        projects: ['proj1', 'proj2']
    };
});
app.use(router.routes()).use(router.allowedMethods());
app.use(serve('./'));
var server = require('http').createServer(app.callback());
eurecaServer.attach(server);
server.listen(8000);

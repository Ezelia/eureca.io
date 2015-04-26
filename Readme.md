eureca.io
=========

eureca (Easy Unobstructive REmote CAll) is a node.js bidirectional RPC library using [Primus.io](https://github.com/primus/primus) as a network layer.

it allow you to call server side function from a browser or nodejs client and vice-versa.

please visit the project web page for more code samples http://eureca.io/

WebRTC support was added in version 0.6.4 : it's based on nodejs WebRTC stack [node-webrtc](https://github.com/js-platform/node-webrtc).


Documentation
=============
The [documentation](http://eureca.io/doc/) work is in progress.


Setup 
======
[![NPM](https://nodei.co/npm/eureca.io.png)](https://npmjs.org/package/eureca.io)


Hello World example
===================

### Client calling server

#### Server side code

```javascript
var Eureca = require('eureca.io');
var eurecaServer = new Eureca.Server();

eurecaServer.exports.helloServer = function (userName) {
	console.log('Hello Server from ',userName);
}
```

#### Browser client side code

```javascript

<script src="/eureca.js"></script>

<body>
<script>
var client = new Eureca.Client(); 

client.ready(function (serverProxy) {

	serverProxy.helloServer();  //will call helloServer in the server side
	
});
</script>
</body>
```

#### Nodejs client side code


```javascript
var Eureca = require('eureca.io');
var client = new Eureca.Client({ uri: 'http://localhost:8000/' });
 
client.ready(function (serverProxy) {
	serverProxy.helloServer();
});
```


More examples 
=============

please check node_modules/eureca.io/examples/ for some example codes


### running 1-http-server example code

open a terminal window and type and cd to node_modules/eureca.io/examples/1-http-server/

```
     node server.js
```


now you can either open a browser window on http://localhost:8000/ or open another terminal window in the same directory and call
open a terminal window and type and cd to node_modules/eureca.io/examples/1-http-server/

```
     node client.js
```

you should see 'Hello from client' on the server side.



TODO / Roadmap
============== 
 * More examples/tutorials



License
=======

```
The MIT License (MIT)
Copyright (c) 2014 Ezelia
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
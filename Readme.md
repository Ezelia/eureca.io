eureca.io
=========

eureca (Easy Unobstructive REmote CAll) is a node.js bidirectional RPC library using [Primus.io](https://github.com/primus/primus) as a network layer.

please visit the project web page for more code samples http://eureca.io/


Setup 
======
[![NPM](https://nodei.co/npm/eureca.io.png)](https://npmjs.org/package/eureca.io)


Code examples 
=============

please check node_modules/eureca.io/examples/ for some example codes


### running 1-http-server example code

open a terminal window and type and cd to node_modules/eureca.io/examples/1-http-server/
```
     node --harmony-proxies server.js
```
note the usage of --harmony-proxies command line argument, this switch enables harmony proxies witch is used by eureca.io library (for more information about harmony proxies see this link http://wiki.ecmascript.org/doku.php?id=harmony:proxies)
if you don't use --harmony-proxies, eureca will still work using a workaround but this is not recommanded. 

now you can either open a browser window on http://localhost:8000/ or open another terminal window in the same directory and call
open a terminal window and type and cd to node_modules/eureca.io/examples/1-http-server/
```
     node --harmony-proxies client.js
```

you should see 'Hello from client' on the server side.



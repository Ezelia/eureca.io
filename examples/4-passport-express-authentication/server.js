//this example is taken from passport-local login example.
//eureca.io stuff after expressjs configuration
//
//
var flash = require('connect-flash')
  , express = require('express')
  , passport = require('passport')
  , util = require('util')
  , LocalStrategy = require('passport-local').Strategy;


var users = [
    { id: 1, username: 'bob', password: 'secret', email: 'bob@example.com' }
  , { id: 2, username: 'joe', password: 'birthday', email: 'joe@example.com' }
];

function findById(id, fn) {
  var idx = id - 1;
  if (users[idx]) {
    fn(null, users[idx]);
  } else {
    fn(new Error('User ' + id + ' does not exist'));
  }
}

function findByUsername(username, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.username === username) {
      return fn(null, user);
    }
  }
  return fn(null, null);
}


// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});


// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUsername(username, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
        return done(null, user);
      })
    });
  }
));



var crypto = require('crypto');
var MemoryStore = express.session.MemoryStore,
    sessionStore = new MemoryStore();


var app = express();

	
var sessionHash={};
var serverSideKey = 'averylongandsecurecryptokey';


// configure Express
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ store: sessionStore, secret: 'keyboard cat' }));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/../../public'));
});


app.get('/', function (req, res) {
   
    // here we generate a secret token from client information end make it available 
    // on the web page that will call eureca.io server
    // the token is storen in an <input hidden> field
    // see views/index.ejs
  if (req.isAuthenticated() && !sessionHash[req.sessionID])
  {
		var hmac   = crypto.createHmac('sha256', serverSideKey);
		var token  = hmac.update(req.sessionID).digest('hex');
		console.log('token = ', token);
		sessionHash[req.sessionID] = token;
  }
  
  res.render('index', { user: req.user, eio : {hash:sessionHash[req.sessionID]} });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user});
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user, message: req.flash('error') });
});


app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
  function(req, res) {
    res.redirect('/');
  });  
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});





// all eureca.io stuff is here ////////////////////////////////////////


var server = require('http').createServer(app);
var EurecaServer = require('../../').EurecaServer;
//var EurecaServer = require('eureca.io').EurecaServer;
var eurecaServer = new EurecaServer({
    transport: 'engine.io',
    authenticate: function (authToken) {
        console.log('auth called');
        for (var h in sessionHash) {
            if (sessionHash[h] == authToken) {
                var client = eurecaServer.getClient(this.connection.id);
                client.authenticated = true;
                return true;
            }
        }
        return false;
    },
    preInvoke: function () {
        var client = eurecaServer.getClient(this.connection.id);
        console.log('pre invoking', client);
        return (client.authenticated === true);
    }
});

//var eurecaServer = new EurecaServer();
eurecaServer.attach(server);
eurecaServer.onConnect(function (connection) {    
    var client = eurecaServer.getClient(connection.id); 
	client.authenticated=false;
}); 
eurecaServer.exports.hello = function () {
	console.log('Hello from client');
}

server.listen(8000);


/////////////////////////////////////////////////////////////////////////////


//app.listen(3000);


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}

var fs = require('fs');
var https = require('https');
var express = require('express');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var app = express();
var bodyParser = require('body-parser');
var argv = require('yargs').argv;
var ejs = require('ejs');

var clients = {};

function fileExists(path) {
  try {
    fs.accessSync(path, fs.F_OK);
  } catch(e) {
    return false;
  }
  return true;
}
function dieWithUsage() {
  console.log("node ndbvis_server.js [--config /path/to/config.json]");
  process.exit(1);
}
var confpath = __dirname + '/' + 'config.json';
if(argv.config) {
  confpath = argv.config;
  console.log("--- ARGV. Using Custom Config Path: ", confpath);
}
if(!fileExists(confpath)) {
  console.error('--- ERROR: No such file at: ', confpath);
  dieWithUsage();
}
console.log("--- Config Path: ", confpath);
var conf = JSON.parse(fs.readFileSync(confpath));
var databases = JSON.parse(fs.readFileSync('databases.json'));

app.set('view engine', 'ejs');
app.engine('ejs', ejs.renderFile);

app.use(express.static(__dirname + '/public'));

app.use(session({
  store: new FileStore({
    path: conf.server.session.path,
    encrypt: true,
    ttl: 2592000 // 30 Days
  }),
  secret: conf.server.session.secret,
  resave: true,
  saveUninitialized: false,
  expires: false
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Login MiddleWare
app.use(function(req, res, next) {
  var sess = req.session;
  if(!sess.username && req.path !== '/login' && req.path !== '/logout') {
    console.log('[WARNING] Not Signed In. Redirecting to Login. req.path = ', req.path);
    res.redirect('/login');
    return;
  }
  next();
});

app.get('/login', function(req, res) {
  res.render('login.html.ejs');
});

app.get('/logout', function(req, res) {
  req.session.destroy();
  res.redirect('/login');
});

app.post('/login', function(req, res) {
  var accounts = conf.server.accounts;
  var username = req.body.username;
  var password = req.body.password;

  if(accounts[username] === password) {
    req.session.username = username;
    res.redirect('/');
    return;
  }
  
  res.redirect('/login');
});

app.get('/', function(req, res) {
  res.render('index.html.ejs');
});

app.get('/dbs', function(req, res) {
  res.json(Object.keys(databases));
});

app.post('/dbs/:dbname/exec', function(req, res) {
  var dbname = req.params.dbname;  
  var pageID = req.body.pageID;
  var sql = req.body.sql;
  var resp = {
    echo: {
      dbname: dbname, 
      sql: sql,
      pageID: pageID
    }
  }

  var connectionString = databases[dbname];
  if(!connectionString) {
    resp.ok = false;
    return res.json(resp);
  }

  var client = clients[dbname] || require('pg-query');
  client.connectionParameters = connectionString;

  var tableName = 'temptable_'+pageID;
  var modsql = "CREATE TEMPORARY TABLE "+tableName+" AS "+sql;

  var typeMode = false;
  if(sql.match(/^\s*SELECT\b/i)) {
    typeMode = true;
  }
  
  client("DROP TABLE IF EXISTS "+tableName, [], function(err, rows1) {
    if(err) {
      console.log('ERR001 = ', err);
      resp.ok = false;
      resp.errcode = 1;
      return res.json(resp);
    }

    client((typeMode ? modsql : sql), [], function(err, rows2) {
      if(err) {
        console.log('ERR002 = ', err);
        resp.ok = false;
        err.toString = err.toString().replace(/^\s*error:\s*/, '');
        resp.err = err;
        resp.errcode = 2;
        
        return res.json(resp);
      }

      if(!typeMode) {
        resp.ok = true;
        resp.rows = rows2;
        return res.json(resp);
      }
      
      client("SELECT * FROM "+tableName, [], function(err, rows3) {
        if(err) {
          console.log('ERR003 = ', err);
          resp.ok = false;
          resp.errcode = 3;
        }
        resp.ok = true;
        resp.rows = rows3; 

        // WARNING: Security issue here.
        // TODO: Sanitize tableName in the SQL below
        client("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '"+tableName+"' ORDER  BY ordinal_position", [], function(err, rows4) {
          if(err) {
            console.log('ERR004 = ', err);
            resp.ok = false;
            resp.errcode = 4;
          }
          resp.types = rows4;
          return res.json(resp);
        });
        
      });

    });


  });

});

var privKey = fs.readFileSync(conf.server.tls.priv).toString();
var publKey = fs.readFileSync(conf.server.tls.publ).toString();
var creds = {key: privKey, cert: publKey};


var httpsServer = https.createServer(creds, app);
console.log('Listening on https://'+conf.server.bind+':'+conf.server.port);
httpsServer.listen(conf.server.port, conf.server.bind);
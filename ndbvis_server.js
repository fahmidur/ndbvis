var fs = require('fs');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var clients = {};
var databases = JSON.parse(fs.readFileSync('databases.json'));

console.log('databases = ', databases);

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(req, res) {
  res.render(__dirname + '/public/index.html');
});

app.get('/databases', function(req, res) {
  res.json(databases);
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

var server = app.listen(3131, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Listening on http://'+host+":"+port);
});
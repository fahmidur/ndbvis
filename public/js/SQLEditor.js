var SQLEditor = function(opts) {
  var self = this;

  if(!opts.input_id) { throw "SQLEditor. required parameter input_id is missing"; }
  self.$input = $('#'+opts.input_id);
  if(self.$input.length === 0) {
    throw "SQLEditor. element from input_id not found";
  }
  self.input = self.$input.get(0);
  self.HFACTOR = parseInt(window.getComputedStyle(self.input, null).fontSize);

  if(!opts.output_id) {
    throw "SQLEditor. required parameter output_id not found";
  }
  self.$output = $('#'+opts.output_id);
  if(self.$output.length === 0) {
    throw "SQLEditor. element from output_id not found";
  }
  self.pageID = opts.pageID;
  if(!self.pageID) {
    throw "SQLEditor. pageID missing";
  }

  if(!opts.editorPage) {
    throw "SQLEditor. editorPage missing";
  }
  self.editorPage = opts.editorPage;

  self.cntrl_engaged = false;

  self.$input.on('keydown', function(e) {
    if(e.keyCode === 17) {
      self.cntrl_engaged = true;
    }
    if(e.keyCode === 13 && self.cntrl_engaged) { // CNTRL + ENTER
      self.execute();
    }
    /*
    if(e.keyCode === 74 && self.cntrl_engaged) { // CNTRL + J
      e.stopPropagation(); e.preventDefault();
      // TODO - go to tab left of current
    }
    if(e.keyCode === 75 && self.cntrl_engaged) { // CNTRL + K
      e.stopPropagation() && e.preventDefault();
      // TODO - go to tab right of current
    }
    */
  });

  self.$input.on('keyup', function(e) {
    // var start = this.selectionStart;
    // var end = this.selectionEnd;

    if(e.keyCode === 17) {
      self.cntrl_engaged = false;
    }

    // self.$input.val(SQLEditor.normalizeSQL(self.$input.val()));

    // this.setSelectionRange(start, end);

    if(e.keyCode === 8 && self.lineAtCaret() === "") {
      self.$input.height(self.$input.height() - 2*self.HFACTOR);
    }
    self.updateInputSize();
  });

  self.rows = null;
  
  var cmElement = $("<span class='ConnectionManager'></span>");
  cmElement.insertBefore(self.$input);
  self.connectionManager = new ConnectionManager({
    $element: cmElement
  });

  self.$wIcon = $('<i class="SQLEditor_wIcon fa fa-spinner fa-spin" style="display:none"></i>');
  self.$wIcon.insertBefore(cmElement);

  self.$executeBtn = $("<button class='SQLEditor_btn'>Execute</button>");
  self.$executeBtn.insertBefore(cmElement);

  self.$executeBtn.on('click', function() {
    self.execute();
  });


  // disabled for now
  // self.enableDesktopScrolling();

  console.log('SQLEditor. self = ', self);
};

SQLEditor.prototype.enableDesktopScrolling = function() {
  var self = this;

  var windowWidth = $(window).width();
  var windowWidthHalf = windowWidth/2;
  var windowWidthSafe = windowWidthHalf * 0.5;
  var windowWidthLava = windowWidthHalf * 0.5;
  self.$output.off('mousemove').on('mousemove', function(e) {
    var x = e.clientX;
    var y = e.clientY;

    var xFromCenter = x - windowWidthHalf;
    var xDir = xFromCenter < 0 ? -1 : 1;
    var xFromCenter = Math.abs(xFromCenter);
    if(xFromCenter < windowWidthSafe) {
      self.$output.stop(); // stop animation
      return;
    }
    xFromCenter -= windowWidthSafe;
    var xVel = xFromCenter / windowWidthLava;    
    var animationTime = Math.floor(6000*(1-xVel));
    // console.log('(x=', x, ', y=', y, '). xFromCenter = ', xFromCenter, 'xVel = ', xVel, 'animationTime = ', animationTime);
    self.$output.stop().animate({scrollLeft: xDir > 0 ? self.$output.get(0).scrollWidth : 0}, animationTime, 'swing');
  });

  self.$output.on('mouseleave', function(e) {
    self.$output.stop(); // stop animation
  });
}

SQLEditor.prototype.lineAtCaret = function() {
  var self = this;
  var txtarea = self.input;

  var scrollPos = txtarea.scrollTop;
  var strPos = 0;
  var br = ((txtarea.selectionStart || txtarea.selectionStart == '0') ?
      "ff" : (document.selection ? "ie" : false ) );
  if (br == "ie") {
      txtarea.focus();
      var range = document.selection.createRange();
      range.moveStart ('character', -txtarea.value.length);
      strPos = range.text.length;
  }
  else if (br == "ff") strPos = txtarea.selectionStart;
  var str = (txtarea.value).substring(0, strPos);
  return str.substr(str.lastIndexOf("\n")+1);
};

SQLEditor.prototype.updateInputSize = function() {
  var self = this;
  self.$input.height(self.input.scrollHeight - 4);
};

SQLEditor.prototype.focus = function() {
  var self = this;

  self.$input.focus();
};
SQLEditor.prototype.setSQL = function(sql) {
  var self = this;
  self.$input.val(sql);
};

SQLEditor.prototype.getSQL = function() {
  var self = this; 

  return self.$input.val();
};

SQLEditor.prototype.translateType = function(type) {
  if(type === 'character varying') {
    return 'varchar';
  }
  if(type === 'timestamp with time zone') {
    return 'timestamp_tz';
  }
  return type;
}

SQLEditor.prototype.renderRows = function(rows, types) { var self = this;
  if(rows.length === 0) {
    self.$wIcon.hide();
    return self.$output.html("0 Rows Returned");
  }
  var properties = Object.keys(rows[0]);
  self.prop_to_type = {};

  self.rows = rows;
  self.types = [];

  var table = document.createElement('table');
    table.className = 'SQLEditor_table'
    var thead = document.createElement('thead');
      var thead_colNames = document.createElement('tr');
        for(var i in properties) { var header = properties[i];
          var th = document.createElement('th');
          th.innerHTML = header;
          thead_colNames.appendChild(th);
        }
      thead.appendChild(thead_colNames);

      if(typeof types !== 'undefined' && types instanceof Array && types.length > 0) {
        var thead_colTypes = document.createElement('tr');
          thead_colTypes.className = 'colTypes';
          for(var i in types) { var type = types[i];
            type.data_type = self.translateType(type.data_type);
            var th = document.createElement('th');
            th.innerHTML = type.data_type;
            thead_colTypes.appendChild(th);
            self.prop_to_type[type.column_name] = type.data_type;
            self.types.push(type.data_type);
          }
        thead.appendChild(thead_colTypes);
      }
      
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    for(var k in rows) { var row = rows[k];
      var tr = document.createElement('tr');
      for(var i in properties) { var header = properties[i];
        var td = document.createElement('td');
        var value = row[header];
        var displayValue = Displayer.displayify((typeof value === 'object') ? JSON.stringify(value) : value, 100);
        td.innerHTML = displayValue;

        td.setAttribute('data-prop', header);
        td.setAttribute('data-row', k);
        td.setAttribute('data-type', self.prop_to_type[header]);

        if(value === null) {
          td.className += ' null'
        }

        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    

  self.$output.empty(); self.$output.get(0).appendChild(table);

  self.$output.find('tbody td').on('click', function(e) {
    console.log("** CLICK **");
    var $this = $(this);
    var rowNum = $this.data('row');
    var prop = $this.data('prop');
    var type = $this.data('type');

    if(typeof displayer === 'undefined') {
      console.error("** displayField. Displayer not found");
      return;
    }

    displayer.display(self.rows[rowNum], prop, self.prop_to_type);
  });
};

SQLEditor.prototype.execute = function() { var self = this;
  self.$wIcon.show();

  var sql = self.$input.val();

  if(sql.match(/^\s*select/i) && !sql.match(/\blimit\s+\d+\b/i)) {
    sql += "\nlimit 1000";
  }

  sql = SQLEditor.normalizeSQL(sql);

  self.$input.val(sql);

  console.log('Executing: ', sql);
  $.post('/dbs/'+self.connectionManager.getCurrentDB()+'/exec', {sql: sql, pageID: self.pageID}, function(data) {
    console.log('data = ', data);
    if(data.ok && data.rows) {
      self.renderRows(data.rows, data.types);
    } 
    else {
      console.log('ERR = ', data.err);
      if(data.err && data.err.toString) {
        self.$output.html("<span class='SQLEditor_error'>"+data.err.toString+"</span>");  
      }
      else
      if(data.err && data.err.hint) {
        self.$output.html("<span class='SQLEditor_error'>"+data.err.hint+"</span>");  
      }
      else {
        self.$output.html("<span class='SQLEditor_error'>Invalid Input</span>");
      }
    }
    self.$wIcon.hide();
    self.editorPage[self.pageID].newborn = false;
  });

  if(restorer && typeof restorer.store === 'function') {restorer.store('SQLEditor. execute');}
};
SQLEditor.normalizeSQL = function(sql) {
  var nsql = "";
  var current_word = "";
  var m;
  var withinQuotes = false;
  
  var sql_length = sql.length;
  for(var i = 0; i < sql_length; ++i) { var ch = sql[i];
    if((m=ch.match(/[a-z\_]/i)) !== null) {
      current_word += ch;
    } else {
      if(!withinQuotes) {
        var upcaseCurrentWord = current_word.toUpperCase();
        if(SQLEditor.keywords[upcaseCurrentWord]) {
          current_word = upcaseCurrentWord;
        }  
      }
      nsql += current_word;
      current_word = "";
      nsql += ch;
    }

    if(!withinQuotes && (ch === "'"||ch === '"')) {
      withinQuotes = true;
    } 
    else
    if(withinQuotes && (ch === "'"||ch === '"')) {
      withinQuotes = false;
    }
  }
  if(!withinQuotes) {
    var upcaseCurrentWord = current_word.toUpperCase();
    if(SQLEditor.keywords[upcaseCurrentWord]) {
      current_word = upcaseCurrentWord;
    }  
  }
  nsql += current_word;
  return nsql;
};
SQLEditor.keywords = {"A": true, "ABORT": true, "ABS": true, "ABSOLUTE": true, "ACCESS": true, "ACTION": true, "ADA": true, "ADD": true, "ADMIN": true, "AFTER": true, "AGGREGATE": true, "ALIAS": true, "ALL": true, "ALLOCATE": true, "ALSO": true, "ALTER": true, "ALWAYS": true, "ANALYSE": true, "ANALYZE": true, "AND": true, "ANY": true, "ARE": true, "ARRAY": true, "AS": true, "ASC": true, "ASENSITIVE": true, "ASSERTION": true, "ASSIGNMENT": true, "ASYMMETRIC": true, "AT": true, "ATOMIC": true, "ATTRIBUTE": true, "ATTRIBUTES": true, "AUTHORIZATION": true, "AVG": true, "BACKWARD": true, "BEFORE": true, "BEGIN": true, "BERNOULLI": true, "BETWEEN": true, "BIGINT": true, "BINARY": true, "BIT": true, "BITVAR": true, "BIT_LENGTH": true, "BLOB": true, "BOOLEAN": true, "BOTH": true, "BREADTH": true, "BY": true, "C": true, "CACHE": true, "CALL": true, "CALLED": true, "CARDINALITY": true, "CASCADE": true, "CASCADED": true, "CASE": true, "CAST": true, "CATALOG": true, "CATALOG_NAME": true, "CEIL": true, "CEILING": true, "CHAIN": true, "CHAR": true, "CHARACTER": true, "CHARACTERISTICS": true, "CHARACTERS": true, "CHARACTER_LENGTH": true, "CHARACTER_SET_CATALOG": true, "CHARACTER_SET_NAME": true, "CHARACTER_SET_SCHEMA": true, "CHAR_LENGTH": true, "CHECK": true, "CHECKED": true, "CHECKPOINT": true, "CLASS": true, "CLASS_ORIGIN": true, "CLOB": true, "CLOSE": true, "CLUSTER": true, "COALESCE": true, "COBOL": true, "COLLATE": true, "COLLATION": true, "COLLATION_CATALOG": true, "COLLATION_NAME": true, "COLLATION_SCHEMA": true, "COLLECT": true, "COLUMN": true, "COLUMN_NAME": true, "COMMAND_FUNCTION": true, "COMMAND_FUNCTION_CODE": true, "COMMENT": true, "COMMIT": true, "COMMITTED": true, "COMPLETION": true, "CONDITION": true, "CONDITION_NUMBER": true, "CONNECT": true, "CONNECTION": true, "CONNECTION_NAME": true, "CONSTRAINT": true, "CONSTRAINTS": true, "CONSTRAINT_CATALOG": true, "CONSTRAINT_NAME": true, "CONSTRAINT_SCHEMA": true, "CONSTRUCTOR": true, "CONTAINS": true, "CONTINUE": true, "CONVERSION": true, "CONVERT": true, "COPY": true, "CORR": true, "CORRESPONDING": true, "COUNT": true, "COVAR_POP": true, "COVAR_SAMP": true, "CREATE": true, "CREATEDB": true, "CREATEROLE": true, "CREATEUSER": true, "CROSS": true, "CSV": true, "CUBE": true, "CUME_DIST": true, "CURRENT": true, "CURRENT_DATE": true, "CURRENT_DEFAULT_TRANSFORM_GROUP": true, "CURRENT_PATH": true, "CURRENT_ROLE": true, "CURRENT_TIME": true, "CURRENT_TIMESTAMP": true, "CURRENT_TRANSFORM_GROUP_FOR_TYPE": true, "CURRENT_USER": true, "CURSOR": true, "CURSOR_NAME": true, "CYCLE": true, "DATA": true, "DATABASE": true, "DATE": true, "DATETIME_INTERVAL_CODE": true, "DATETIME_INTERVAL_PRECISION": true, "DAY": true, "DEALLOCATE": true, "DEC": true, "DECIMAL": true, "DECLARE": true, "DEFAULT": true, "DEFAULTS": true, "DEFERRABLE": true, "DEFERRED": true, "DEFINED": true, "DEFINER": true, "DEGREE": true, "DELETE": true, "DELIMITER": true, "DELIMITERS": true, "DENSE_RANK": true, "DEPTH": true, "DEREF": true, "DERIVED": true, "DESC": true, "DESCRIBE": true, "DESCRIPTOR": true, "DESTROY": true, "DESTRUCTOR": true, "DETERMINISTIC": true, "DIAGNOSTICS": true, "DICTIONARY": true, "DISABLE": true, "DISCONNECT": true, "DISPATCH": true, "DISTINCT": true, "DO": true, "DOMAIN": true, "DOUBLE": true, "DROP": true, "DYNAMIC": true, "DYNAMIC_FUNCTION": true, "DYNAMIC_FUNCTION_CODE": true, "EACH": true, "ELEMENT": true, "ELSE": true, "ENABLE": true, "ENCODING": true, "ENCRYPTED": true, "END": true, "END-EXEC": true, "EQUALS": true, "ESCAPE": true, "EVERY": true, "EXCEPT": true, "EXCEPTION": true, "EXCLUDE": true, "EXCLUDING": true, "EXCLUSIVE": true, "EXEC": true, "EXECUTE": true, "EXISTING": true, "EXISTS": true, "EXP": true, "EXPLAIN": true, "EXTERNAL": true, "EXTRACT": true, "FALSE": true, "FETCH": true, "FILTER": true, "FINAL": true, "FIRST": true, "FLOAT": true, "FLOOR": true, "FOLLOWING": true, "FOR": true, "FORCE": true, "FOREIGN": true, "FORTRAN": true, "FORWARD": true, "FOUND": true, "FREE": true, "FREEZE": true, "FROM": true, "FULL": true, "FUNCTION": true, "FUSION": true, "G": true, "GENERAL": true, "GENERATED": true, "GET": true, "GLOBAL": true, "GO": true, "GOTO": true, "GRANT": true, "GRANTED": true, "GREATEST": true, "GROUP": true, "GROUPING": true, "HANDLER": true, "HAVING": true, "HEADER": true, "HIERARCHY": true, "HOLD": true, "HOST": true, "HOUR": true, "IDENTITY": true, "IGNORE": true, "ILIKE": true, "IMMEDIATE": true, "IMMUTABLE": true, "IMPLEMENTATION": true, "IMPLICIT": true, "IN": true, "INCLUDING": true, "INCREMENT": true, "INDEX": true, "INDICATOR": true, "INFIX": true, "INHERIT": true, "INHERITS": true, "INITIALIZE": true, "INITIALLY": true, "INNER": true, "INOUT": true, "INPUT": true, "INSENSITIVE": true, "INSERT": true, "INSTANCE": true, "INSTANTIABLE": true, "INSTEAD": true, "INT": true, "INTEGER": true, "INTERSECT": true, "INTERSECTION": true, "INTERVAL": true, "INTO": true, "INVOKER": true, "IS": true, "ISNULL": true, "ISOLATION": true, "ITERATE": true, "JOIN": true, "K": true, "KEY": true, "KEY_MEMBER": true, "KEY_TYPE": true, "LANCOMPILER": true, "LANGUAGE": true, "LARGE": true, "LAST": true, "LATERAL": true, "LEADING": true, "LEAST": true, "LEFT": true, "LENGTH": true, "LESS": true, "LEVEL": true, "LIKE": true, "LIMIT": true, "LISTEN": true, "LN": true, "LOAD": true, "LOCAL": true, "LOCALTIME": true, "LOCALTIMESTAMP": true, "LOCATION": true, "LOCATOR": true, "LOCK": true, "LOGIN": true, "LOWER": true, "M": true, "MAP": true, "MATCH": true, "MATCHED": true, "MAX": true, "MAXVALUE": true, "MEMBER": true, "MERGE": true, "MESSAGE_LENGTH": true, "MESSAGE_OCTET_LENGTH": true, "MESSAGE_TEXT": true, "METHOD": true, "MIN": true, "MINUTE": true, "MINVALUE": true, "MOD": true, "MODE": true, "MODIFIES": true, "MODIFY": true, "MODULE": true, "MONTH": true, "MORE": true, "MOVE": true, "MULTISET": true, "MUMPS": true, "NAME": true, "NAMES": true, "NATIONAL": true, "NATURAL": true, "NCHAR": true, "NCLOB": true, "NESTING": true, "NEW": true, "NEXT": true, "NO": true, "NOCREATEDB": true, "NOCREATEROLE": true, "NOCREATEUSER": true, "NOINHERIT": true, "NOLOGIN": true, "NONE": true, "NORMALIZE": true, "NORMALIZED": true, "NOSUPERUSER": true, "NOT": true, "NOTHING": true, "NOTIFY": true, "NOTNULL": true, "NOWAIT": true, "NULL": true, "NULLABLE": true, "NULLIF": true, "NULLS": true, "NUMBER": true, "NUMERIC": true, "OBJECT": true, "OCTETS": true, "OCTET_LENGTH": true, "OF": true, "OFF": true, "OFFSET": true, "OIDS": true, "OLD": true, "ON": true, "ONLY": true, "OPEN": true, "OPERATION": true, "OPERATOR": true, "OPTION": true, "OPTIONS": true, "OR": true, "ORDER": true, "ORDERING": true, "ORDINALITY": true, "OTHERS": true, "OUT": true, "OUTER": true, "OUTPUT": true, "OVER": true, "OVERLAPS": true, "OVERLAY": true, "OVERRIDING": true, "OWNER": true, "PAD": true, "PARAMETER": true, "PARAMETERS": true, "PARAMETER_MODE": true, "PARAMETER_NAME": true, "PARAMETER_ORDINAL_POSITION": true, "PARAMETER_SPECIFIC_CATALOG": true, "PARAMETER_SPECIFIC_NAME": true, "PARAMETER_SPECIFIC_SCHEMA": true, "PARTIAL": true, "PARTITION": true, "PASCAL": true, "PASSWORD": true, "PATH": true, "PERCENTILE_CONT": true, "PERCENTILE_DISC": true, "PERCENT_RANK": true, "PLACING": true, "PLI": true, "POSITION": true, "POSTFIX": true, "POWER": true, "PRECEDING": true, "PRECISION": true, "PREFIX": true, "PREORDER": true, "PREPARE": true, "PREPARED": true, "PRESERVE": true, "PRIMARY": true, "PRIOR": true, "PRIVILEGES": true, "PROCEDURAL": true, "PROCEDURE": true, "PUBLIC": true, "QUOTE": true, "RANGE": true, "RANK": true, "READ": true, "READS": true, "REAL": true, "RECHECK": true, "RECURSIVE": true, "REF": true, "REFERENCES": true, "REFERENCING": true, "REGR_AVGX": true, "REGR_AVGY": true, "REGR_COUNT": true, "REGR_INTERCEPT": true, "REGR_R2": true, "REGR_SLOPE": true, "REGR_SXX": true, "REGR_SXY": true, "REGR_SYY": true, "REINDEX": true, "RELATIVE": true, "RELEASE": true, "RENAME": true, "REPEATABLE": true, "REPLACE": true, "RESET": true, "RESTART": true, "RESTRICT": true, "RESULT": true, "RETURN": true, "RETURNED_CARDINALITY": true, "RETURNED_LENGTH": true, "RETURNED_OCTET_LENGTH": true, "RETURNED_SQLSTATE": true, "RETURNS": true, "REVOKE": true, "RIGHT": true, "ROLE": true, "ROLLBACK": true, "ROLLUP": true, "ROUTINE": true, "ROUTINE_CATALOG": true, "ROUTINE_NAME": true, "ROUTINE_SCHEMA": true, "ROW": true, "ROWS": true, "ROW_COUNT": true, "ROW_NUMBER": true, "RULE": true, "SAVEPOINT": true, "SCALE": true, "SCHEMA": true, "SCHEMA_NAME": true, "SCOPE": true, "SCOPE_CATALOG": true, "SCOPE_NAME": true, "SCOPE_SCHEMA": true, "SCROLL": true, "SEARCH": true, "SECOND": true, "SECTION": true, "SECURITY": true, "SELECT": true, "SELF": true, "SENSITIVE": true, "SEQUENCE": true, "SERIALIZABLE": true, "SERVER_NAME": true, "SESSION": true, "SESSION_USER": true, "SET": true, "SETOF": true, "SETS": true, "SHARE": true, "SHOW": true, "SIMILAR": true, "SIMPLE": true, "SIZE": true, "SMALLINT": true, "SOME": true, "SOURCE": true, "SPACE": true, "SPECIFIC": true, "SPECIFICTYPE": true, "SPECIFIC_NAME": true, "SQL": true, "SQLCODE": true, "SQLERROR": true, "SQLEXCEPTION": true, "SQLSTATE": true, "SQLWARNING": true, "SQRT": true, "STABLE": true, "START": true, "STATE": true, "STATEMENT": true, "STATIC": true, "STATISTICS": true, "STDDEV_POP": true, "STDDEV_SAMP": true, "STDIN": true, "STDOUT": true, "STORAGE": true, "STRICT": true, "STRUCTURE": true, "STYLE": true, "SUBCLASS_ORIGIN": true, "SUBLIST": true, "SUBMULTISET": true, "SUBSTRING": true, "SUM": true, "SUPERUSER": true, "SYMMETRIC": true, "SYSID": true, "SYSTEM": true, "SYSTEM_USER": true, "TABLE": true, "TABLESAMPLE": true, "TABLESPACE": true, "TABLE_NAME": true, "TEMP": true, "TEMPLATE": true, "TEMPORARY": true, "TERMINATE": true, "THAN": true, "THEN": true, "TIES": true, "TIME": true, "TIMESTAMP": true, "TIMEZONE_HOUR": true, "TIMEZONE_MINUTE": true, "TO": true, "TOAST": true, "TOP_LEVEL_COUNT": true, "TRAILING": true, "TRANSACTION": true, "TRANSACTIONS_COMMITTED": true, "TRANSACTIONS_ROLLED_BACK": true, "TRANSACTION_ACTIVE": true, "TRANSFORM": true, "TRANSFORMS": true, "TRANSLATE": true, "TRANSLATION": true, "TREAT": true, "TRIGGER": true, "TRIGGER_CATALOG": true, "TRIGGER_NAME": true, "TRIGGER_SCHEMA": true, "TRIM": true, "TRUE": true, "TRUNCATE": true, "TRUSTED": true, "TYPE": true, "UESCAPE": true, "UNBOUNDED": true, "UNCOMMITTED": true, "UNDER": true, "UNENCRYPTED": true, "UNION": true, "UNIQUE": true, "UNKNOWN": true, "UNLISTEN": true, "UNNAMED": true, "UNNEST": true, "UNTIL": true, "UPDATE": true, "UPPER": true, "USAGE": true, "USER": true, "USER_DEFINED_TYPE_CATALOG": true, "USER_DEFINED_TYPE_CODE": true, "USER_DEFINED_TYPE_NAME": true, "USER_DEFINED_TYPE_SCHEMA": true, "USING": true, "VACUUM": true, "VALID": true, "VALIDATOR": true, "VALUE": true, "VALUES": true, "VARCHAR": true, "VARIABLE": true, "VARYING": true, "VAR_POP": true, "VAR_SAMP": true, "VERBOSE": true, "VIEW": true, "VOLATILE": true, "WHEN": true, "WHENEVER": true, "WHERE": true, "WIDTH_BUCKET": true, "WINDOW": true, "WITH": true, "WITHIN": true, "WITHOUT": true, "WORK": true, "WRITE": true, "YEAR": true, "ZONE": true};
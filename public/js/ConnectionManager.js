var ConnectionManager = function(opts) {
  var self = this;

  if(!opts.$element || opts.$element.length === 0) {
    throw "ConnectionManager. base element required";
  }

  self.$element = opts.$element;

  self.current_dbname = null;

  $.getJSON('/databases', function(data) {
    ConnectionManager.databases = data;
    self.render();
  });

  self.$select = null;
  self.dbname_queue = [];

  ConnectionManager.managers.push(self);
}

ConnectionManager.prototype.getCurrentDB = function() {
  var self = this;
  if(!self.$select || self.$select === "") {
    return;
  }
  return self.$select.val();
};

ConnectionManager.prototype.setCurrentDB = function(dbname) {
  var self = this;
  if(!dbname) { return; }
  if(self.$select) {
    return self.$select.val(dbname);  
  } else {
    self.dbname_queue.push(dbname);
    return true;
  }
};

ConnectionManager.prototype.render = function() {
  var self = this;

  self.$element.empty();

  self.$select = $("<select class='pull-right'></select");
  for(var dbname in ConnectionManager.databases) { 
    var connString = ConnectionManager.databases[dbname];
    var optionNode = $("<option value='"+dbname+"'>"+dbname+"</option>");
    if(self.current_dbname && dbname == self.selected_dbname) {
      optionNode.attr('selected', 'true');
    }
    self.$select.append(optionNode);
  }
  self.$element.append(self.$select);
  if(self.dbname_queue.length > 0) {
    self.setCurrentDB(self.dbname_queue.pop());
  }
  self.$select.on('change', function() {
    self.current_dbname = $(this).val();
    if(restorer && typeof restorer.store === 'function') {restorer.store();}
  });
}

ConnectionManager.managers = [];
ConnectionManager.databases = {};
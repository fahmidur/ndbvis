var Restorer = function(opts) {
  var self = this;

  if(!opts.epage) {
    throw "Restorer. epage required";
  }

  self.epage = opts.epage;
};

Restorer.prototype.restore = function() {
  var self = this;
  var npage = null;

  var pages_str = localStorage.getItem("pages");
  var pages = [];

  if(pages_str) {
    pages = JSON.parse(pages_str);
  }
  if(pages.length === 0) {
    return self.epage.addPage();
  }
  var active_pageID = localStorage.getItem("active_pageID");
  for(var pageID in pages) { var page = pages[pageID];
    npage = self.epage.addPage(pageID);
    npage.sqlEditor.setSQL(page.sql);
    npage.sqlEditor.connectionManager.setCurrentDB(page.dbname);
  }
  if(active_pageID) {
    self.epage.pages[active_pageID].fn.activatePage();
  }
};

Restorer.prototype.store = function() {
  var self = this;

  var pages = {};
  for(var pageID in self.epage.pages) { var page = self.epage.pages[pageID];
    pages[pageID] = {
      sql: page.sqlEditor.getSQL(),
      dbname: page.sqlEditor.connectionManager.getCurrentDB()
    };
  }
  localStorage.setItem("pages", JSON.stringify(pages));
  localStorage.setItem("active_pageID", self.epage.active_pageID);
};
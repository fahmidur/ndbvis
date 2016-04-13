var EditorPage = function(opts) { var self = this;

  if(!opts.pages_id) { throw "EditorPage. required parameter pages_id missing"; }
  self.$pages = $('#'+opts.pages_id);
  if(self.$pages.length === 0) { throw "EditorPage. $pages not found. "; }

  if(!opts.nav_id) { throw "EditorPage. required parameter nav_id missing"; }
  self.$nav = $('#'+opts.nav_id);
  if(self.$nav.length === 0) { throw "EditorPage. $nav not found"; }


  if(!opts.addPageBtn_id) { throw "EditorPage. required parameter addPageBtn_id missing"; }
  self.$addPageBtn = $('#'+opts.addPageBtn_id);
  if(!self.$addPageBtn) { throw "EditorPage. $addPageBtn not found"; }

  self.pages = {

  };
  self.active_pageID = null;

  self.$addPageBtn.on('click', function() {
    self.addPage();
  });

  self.active_pageID_history = [];
  self.active_pageID = null;
  console.log('EditorPage. self = ', self);
};

EditorPage.prototype.addPage = function(override_pageID, fromRestorer) { var self = this;
  var pageID = null;
  var pageNumber = Object.keys(self.pages).length + 1;
  var pageTimestamp = ""+(new Date()).getTime();
  if(typeof override_pageID !== 'undefined') {
    pageID = override_pageID;
  } else {  
    pageID = parseInt(pageNumber+pageTimestamp).toString(16);  
  }
  

  var tab = $("<li><a href='#'>"+pageID+"&nbsp;<i class='fa fa-times-circle EditorPage_closeTabBtn' id='EditorPage_closeTabBtn-"+pageID+"'></i></a></li>");
  tab.insertBefore(self.$addPageBtn);

  var page = $("<div class='page'><textarea class='inputarea' id='SQLEditor-"+pageID+"-input'></textarea><div class='output' id='SQLEditor-"+pageID+"-output'></div></div>");
  page.attr('id', 'page-'+pageID); page.data('pageID', pageID);
  page.css('display', 'none');

  self.$pages.append(page);

  var sqlEditor = new SQLEditor({
    input_id: 'SQLEditor-'+pageID+"-input",
    output_id: 'SQLEditor-'+pageID+"-output",
    pageID: pageID,
    editorPage: self
  });

  function activatePage(preventStore) {
    var this_page = self.pages[pageID];
    var old_page = self.pages[self.active_pageID];
    if(old_page && this_page.newborn) {
      sqlEditor.connectionManager.setCurrentDB(old_page.sqlEditor.connectionManager.getCurrentDB());
    }
    self.hideAllPages();
    tab.addClass('active');
    page.show();
    self.active_pageID = pageID;
    self.active_pageID_history.unshift(pageID);
    sqlEditor.focus();
    if(typeof preventStore === 'undefined') {
      if(restorer && typeof restorer.store === 'function') {restorer.store('EditorPage. activatePage');}  
    }
  }

  self.pages[pageID] = {
    pageNumber: pageNumber,
    pageTimeStamp: pageTimestamp,
    pageID: pageID,
    sqlEditor: sqlEditor,
    newborn: (typeof fromRestorer === 'undefined') ? true : false,
    el: {
      tab: tab,
      page: page
    },
    fn: {
      activatePage: activatePage
    }
  };

  $('#EditorPage_closeTabBtn-'+pageID).click(function(e) {
    e.stopPropagation(); e.preventDefault();
    for(var k in self.pages[pageID].el) { var $el = self.pages[pageID].el[k];
      $el.remove();
    }
    delete self.pages[pageID];
    if(restorer && typeof restorer.store === 'function') {restorer.store('EditorPage. pageClose');}
    var new_history = [];
    for(var i in self.active_pageID_history) { var _pageID = self.active_pageID_history[i];
      if(_pageID !== pageID) {
        new_history.push(_pageID);
      }
    }
    self.active_pageID_history = new_history;
    self.pages[new_history[0]].fn.activatePage();
  });

  

  tab.on('click', function(e) { activatePage(); });
  if(typeof fromRestorer === 'undefined') {
    activatePage();
  }
  return self.pages[pageID];
};

EditorPage.prototype.hideAllPages = function() { var self = this;
  for(var k in self.pages) { var page = self.pages[k];
    page.el.tab.removeClass('active');
    page.el.page.hide();
  }
};
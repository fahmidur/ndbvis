var EditorPage = function(opts) { var self = this;

  if(!opts.pages_id) { throw "EditorPage. required parameter pages_id missing"; }
  self.$pages = $('#'+opts.pages_id);
  if(self.$pages.length === 0) { throw "EditorPage. $pages not found. "; }

  if(!opts.nav_id) { throw "EditorPage. required parameter nav_id missing"; }
  self.$nav = $('#'+opts.nav_id);
  if(self.$nav.length === 0) { throw "EditorPage. $nav not found"; }


  if(!opts.addPageBtn_id) { throw "EditorPage. required parameter addPageBtn_id missing"; }
  self.$addPageBtn = $('#'+opts.addPageBtn_id);
  if(!self.$addPageBtn.length === 0) { throw "EditorPage. $addPageBtn not found"; }

  if(!opts.indicator_cntrl_id) { throw "EditorPage. required parameter indicator_cntrl_id missing"; }
  self.$indicatorCntrl = $('#'+opts.indicator_cntrl_id);
  if(!self.$indicatorCntrl.length === 0) { throw "EditorPage. $indicatorCntrl not found"; }

  self.pages = {

  };
  self.active_pageID = null;

  self.$addPageBtn.on('click', function() {
    self.addPage();
  });

  self.cntrl_engaged = false; self.cntrl_engage(false);
  document.addEventListener('visibilitychange', function(){
    console.log('EditorPage. visibilitychange. resetting cntrl_engaged');
    //self.cntrl_engaged = false;
    self.cntrl_engage(false);
  });

  self.$body = $('body');
  self.$body.on('keydown', function(e) {
    if(e.keyCode === 17) { 
      //self.cntrl_engaged = true;
      self.cntrl_engage(true);
    }
    if(self.cntrl_engaged && (e.keyCode === 188 || e.keyCode === 190)) { // ',' '.'
      var atab = self.pages[self.active_pageID].el.tab;
      var ntab;
      if(e.keyCode === 188) { // ','
        ntab = (atab.prev('.tab'));
        ntab = (ntab && ntab.length > 0) ? ntab : atab.parent().find('.tab:last');
        ntab.click();
      }
      else
      if(e.keyCode === 190) { // '.'
        ntab = atab.next('.tab');
        ntab = (ntab && ntab.length > 0) ? ntab : atab.parent().find('.tab:first');
        ntab.click();
      }
    }
  });
  self.$body.on('keyup', function(e) {
    if(e.keyCode === 17) { 
      //self.cntrl_engaged = false;
      self.cntrl_engage(false);
    }
  });

  self.active_pageID_history = [];
  self.active_pageID = null;
  console.log('EditorPage. self = ', self);
};

EditorPage.prototype.cntrl_engage = function(bool) {
  var self = this;
  if(typeof bool != 'boolean') {
    throw "Invalid argument, expecting boolean";
  }
  self.cntrl_engaged = bool;
  if(self.cntrl_engaged) {
    self.$indicatorCntrl.addClass('active');
  } else {
    self.$indicatorCntrl.removeClass('active');
  }
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


  var tab = $("<li class='tab'><a href='#'>"+pageID+"&nbsp;<i class='fa fa-times-circle EditorPage_closeTabBtn' id='EditorPage_closeTabBtn-"+pageID+"'></i></a></li>");
  tab.insertBefore(self.$addPageBtn);

  var page = $("<div class='page'><textarea class='inputarea' id='SQLEditor-"+pageID+"-input'></textarea><div class='output' id='SQLEditor-"+pageID+"-output'></div></div>");
  page.attr('id', 'page-'+pageID); page.data('pageID', pageID);
  page.css('display', 'none');

  self.$pages.append(page);

  var sqlEditor = new SQLEditor({
    input_id: 'SQLEditor-'+pageID+"-input",
    output_id: 'SQLEditor-'+pageID+"-output",
    pageID: pageID
  });

  var newborn = (typeof fromRestorer === 'undefined') ? true : false;
  function activatePage(preventStore) {
    var old_page = self.pages[self.active_pageID];
    // Newborn pages use the connection manager
    // of the previously active page 'old_page'
    // if(old_page && newborn) {
    //   sqlEditor.connectionManager.setCurrentDB(old_page.sqlEditor.connectionManager.getCurrentDB());
    // }
    // self.hideAllPages();
    if(old_page) {
      old_page.el.tab.removeClass('active');
      old_page.el.page.hide();
      
      if(newborn) {
        sqlEditor.connectionManager.setCurrentDB(old_page.sqlEditor.connectionManager.getCurrentDB());   
      }
    }

    tab.addClass('active');
    page.show();
    self.active_pageID = pageID;
    self.active_pageID_history.unshift(pageID);
    sqlEditor.focus();
    sqlEditor.updateInputSize();
    if(typeof preventStore === 'undefined') {
      if(restorer && typeof restorer.store === 'function') {restorer.store('EditorPage. activatePage');}
    }
    newborn = false;
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

var Displayer = function(opts) {
  var self = this;
  self.$curtain = $('#'+opts.curtain_id);
  if(!self.$curtain || self.$curtain.length === 0) {
    throw "Displayer. element from curtain_id not found";
  }

  self.visible = false;
  self.ANIMATION_SPEED = 200;

  self.$window = $('#'+opts.window_id);
  if(!self.$window || self.$window.length === 0) {
    throw "Displayer. window from window_id not found";
  }
  self.$close = self.$window.find('.close');
  self.$content = self.$window.find('.content');

  self.$rWindow = $(window);
  self.hide();
  self.adjustWindow();

  self.$rWindow.on('resize', function() {
    self.adjustWindow();
  });

  self.$close.on('click', function() {
    self.hide();
  });

  $(document).on('keydown', function(e) {
    if(e.keyCode !== 27) {
      return;
    }
    self.hide();
  });

  self.windowClick = false;
  self.$window.on('click', function(e) {
    self.windowClick = true;
  });

  $(document).on('click', function(e) {
    if(self.visible === false) {
      return;
    }
    if(self.windowClick) {
      self.windowClick = false;
      return;
    }
    self.hide();
  });
};

Displayer.displayify = function(str, trimSize) {
  if(typeof str !== 'string') {
    return str;
  }
  if(typeof trimSize !== 'undefined' && typeof trimSize === 'number') {
    if(str.length > trimSize) {
      str = str.substring(0, trimSize);
      str += '...';
    }
  }
  var tagsToReplace = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '\n': '<br>'
  };
  function replaceTag(tag) {
      return tagsToReplace[tag] || tag;
  };
  return str.replace(/[&<>\n]/g, replaceTag);
};

// NOTE-TO-SELF: This is god-awful
// TODO: Generate DOM Tree instead and return That
// Don't go building strings
Displayer.prototype.renderJSON = function(data) {
  var r = "";
  for(var k in data) { var v = data[k];
    r += "<div class='json-key'><i class='fa fa-plus json-x-bt'></i>&nbsp;"+k+"</div>";
    if(typeof v === 'object') {r += "<div class='json-data'>"+this.renderJSON(v)+"</div>";}
    else {r += "<div class='json-data'>"+v+"</div>"; }
  }
  return r;
}

Displayer.prototype.wireRenderJSON = function(el) {
  $('.json-key').on('click', function(e) { e.stopPropagation(); e.preventDefault(); var t=$(this);
    if(t.find('.json-x-bt').hasClass('fa-plus')) {
      t.next('.json-data').slideDown();$(this).find('.json-x-bt').removeClass('fa-plus').addClass('fa-minus');
    } else {
      t.next('.json-data').slideUp();$(this).find('.json-x-bt').removeClass('fa-minus').addClass('fa-plus');
    }
  });
  $('.json-x-bt').on('click', function(e) { e.stopPropagation(); e.preventDefault(); var t=$(this);
    if(t.hasClass('fa-plus')) {
      t.parent().next('.json-data').slideDown().find('.json-data').each( function() {$(this).slideDown(); });
      t.parent().next('.json-data').find('.json-x-bt').removeClass('fa-plus').addClass('fa-minus');
      t.removeClass('fa-plus').addClass('fa-minus');
    } else {
      t.parent().next('.json-data').slideUp().find('.json-data').each( function() {$(this).slideUp(); });
      t.parent().next('.json-data').find('.json-x-bt').removeClass('fa-minus').addClass('fa-plus');
      t.removeClass('fa-minus').addClass('fa-plus');
    }
  });
};

Displayer.prototype.makeJSON = function(obj) {
  var self = this;

  var $el = $("<div class='makeJSON'></div>");

  var $header = $("<div class='makeJSON-header vheader'></div>");
    var $btnRaw = $("<span class='vbtn active'>Raw</span>"); $header.append($btnRaw);
    var $btnPretty = $("<span class='vbtn'>Pretty</span>"); $header.append($btnPretty);
    var $btnTree = $("<span class='vbtn'>Tree</span>"); $header.append($btnTree);
  $el.append($header);

  var $body = $("<div class='makeJSON-body'></div>");
  $body.html(JSON.stringify(obj));
  $el.append($body);

  return $el
};

Displayer.prototype.display = function(rowData, prop, prop2type) {
  var self = this;

  console.log('** displayer. display. rowData = ', rowData, ' prop = ', prop, 'prop2type = ', prop2type);

  var data = Displayer.displayify(rowData[prop]);
  var propType = prop2type[prop];

  if(!rowData) {
    return;
  }

  self.$content.empty();

  self.$fields = $("<div class='fields'></div>");
  var i = 0;
  for(var k in rowData) {
    var $button = $("<div class='prop'><span class='name'>"+k+"</span><span class='type'>"+prop2type[k]+"</span></div>");
    $button.attr('data-name', k);
    if(k === prop) {
      $button.addClass('active');
    }
    self.$fields.append($button);
  }
  if(!self.isLandscape()) {
    self.$fields.hide();
  }
  self.$content.append(self.$fields);
  self.$fields.find('.prop').on('click', function(e) {
    var propName = $(this).data('name');
    self.display(rowData, propName, prop2type);
  });

  self.$main = $("<div class='main'></div>");
    self.$cprop = $("<div class='cprop'><span class='name'>"+prop+"</span><span class='type'>("+propType+")</span></div>");
      self.$ftb = $("<span class='field-toggle fbtn'></span>");
      if(self.isLandscape()) {
        self.$ftb.html("<i class='fa fa-chevron-left'></i>");
      } else {
        self.$ftb.html("<i class='fa fa-chevron-right'></i>");
      }
      self.$cprop.prepend(self.$ftb);
    self.$main.append(self.$cprop);

    self.$body = $("<div class='body'></div>");


    if(typeof data === 'string' || typeof data === 'number') {
      self.$body.html(data);
    }
    else
    if(typeof data === 'object') {
      if(data === null) {
        self.$body.html("<span class='null'>null</span>");
      } else {
        self.$body.empty();
        var jsonNode = self.makeJSON(data);
        self.$body.append(jsonNode);
        // self.$body.html(JSON.stringify(data));
      }
    }
    self.$main.append(self.$body);

  self.$content.append(self.$main);

  self.$ftb.on('click', function() {
    if(self.$fields.is(':visible')) {
      self.$fields.hide();
      $(this).find('i').removeClass('fa-chevron-left').addClass('fa-chevron-right');
    } else {
      self.$fields.show();
      $(this).find('i').removeClass('fa-chevron-right').addClass('fa-chevron-left');
    }
  });

  self.show();
  self.adjustWindow();
};

Displayer.prototype.isLandscape = function() {
  var self = this;
  if(self.rWindowWidth >= self.rWindowHeight) {
    return true;
  }
  return false;
}

Displayer.prototype.adjustWindow = function() {
  var self = this;

  self.$rWindow = $(window);
  self.rWindowWidth = self.$rWindow.width();
  self.rWindowHeight = self.$rWindow.height();

  var padding = 16;
  self.$window.css('width', self.rWindowWidth-2*padding);
  self.$window.css('height', self.rWindowHeight-2*padding);
  self.$window.css('top', padding);
  self.$window.css('left', padding);
};

Displayer.prototype.hide = function() {
  var self = this;
  $('body').css('overflow', 'inherit');
  self.$window.fadeOut(self.ANIMATION_SPEED);
  self.$curtain.fadeOut(self.ANIMATION_SPEED, function() {
    self.visible = false;
  });
};

Displayer.prototype.show = function() {
  var self = this;
  $('body').css('overflow', 'hidden');
  self.$curtain.fadeIn(self.ANIMATION_SPEED);
  self.$window.fadeIn(self.ANIMATION_SPEED, function() {
    self.visible = true;
    self.$window.animate({scrollTop: 0}, 0);
  });
}

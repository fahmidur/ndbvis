var Displayer = function(opts) {
  var self = this;
  console.log("**** opts = ", opts);
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
}

Displayer.prototype.display = function(data) {
  var self = this;

  if(!data) {
    return;
  }
  
  if(typeof data === 'string' || typeof data === 'number') {
    data = ''+data;
    self.$content.html(Displayer.displayify(data));  
  }
  else
  if(typeof data === 'object') {
    self.$content.html(self.renderJSON(data));
    self.wireRenderJSON();
  }

  self.show();
  self.adjustWindow();
};

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
    console.log('** setting visible = false');
    self.visible = false;
  });
};

Displayer.prototype.show = function() {
  var self = this;
  $('body').css('overflow', 'hidden');
  self.$curtain.fadeIn(self.ANIMATION_SPEED);
  self.$window.fadeIn(self.ANIMATION_SPEED, function() {
    console.log('** setting visible = true');
    self.visible = true;
  });
}
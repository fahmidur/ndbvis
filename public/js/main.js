var epage = null;
var restorer = null;
var displayer = null;


$(function() {
  displayer = new Displayer({
    curtain_id: 'displayer_curtain',
    window_id: 'displayer_window'
  });
  epage = new EditorPage({
    pages_id: 'pages',
    nav_id: 'nav',
    addPageBtn_id: 'add_page_btn',
    indicator_cntrl_id: 'indicator_cntrl'
  });

  restorer = new Restorer({
    epage: epage
  });
  
  restorer.restore();
});

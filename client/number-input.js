/* global $ */
/* this is an example for validation and change events */
/*Kenji revise on 2018 Apr 23*/
$.fn.numericInputExample = function() {
  'use strict';
  var element = $(this),
    footer = element.find('tfoot tr'),
    dataRows = element.find('tbody tr'),
    initialTotal = function() {
       let column, total;
      for (column = 2; column < footer.children().length; column++) {
        total = 0;
        dataRows.each(function() {
          let row = $(this);
          total += parseFloat(row.children()[column].innerHTML);
        });
        footer.children()[column].innerHTML = total;
      };
      footer.children()[2].innerHTML = parseInt(footer.children()[2].innerHTML) + parseInt(footer.children()[3].innerHTML/60);
      footer.children()[3].innerHTML = footer.children()[3].innerHTML % 60;
    };
  element.find('td').on('change', function(evt) {
    console.log('td changed called')
    initialTotal();
    /*
    var cell = $(this),
      column = cell.index(),
      total = 0;
    if (column === 0) {
      return;
    }
    element.find('tbody tr').each(function() {
      var row = $(this);
      total += parseFloat(row.children()[column].text());
    });
    if (column === 1 && total > 5000) {
      $('.alert').show();
      return false; // changes can be rejected
    } else {
      $('.alert').hide();
      footer.children().eq(column).text(total);
    }
    */
  }).on('validate', function(evt, value) {
    var cell = $(this),
      column = cell.index();
    if ((column === 1 || column === 2) && (value > 100)) {
      alert("不得高于100");
      return false;
    } else if (column === 3 && value > 59){
      alert("59分钟是上限");
      return false;
    }
  });
  initialTotal();
  return this;
};

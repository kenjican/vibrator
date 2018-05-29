let socket;
let HzBarC;
let t1 = 0;
let DT = [],
  PV = [],
  Hz = [];
let testD;
let echartOption = {};
/*
first step is to build DOM tree,then could bind event and render data
*/

/*
update information in thress cards:time-table,opModetable,expInfo
*/
$.get('/getStts', (res) => {
  updtStts(res);
})


/*
initial echarts
*/
$.getJSON('./client/echarts.json', (data) => {
  echartOption = data;
  HzBarC.setOption(
    echartOption.default
  );
});

HzBarC = echarts.init($('#HzBarC')[0]);
/*
update the ongoing data or last experiment data
*/
(() => {
  $.get('http://' + window.location.hostname + ':8889/getRT', (result) => {
    parseHis(result);
  }).fail(() => {
    rcws();
    //alert('数据库断线，无法记录数据，请联系供应商');
  });
})();




let VFDBcmd;

$.getJSON('./client/VFDBcmd.json', (data) => {
  VFDBcmd = data;
});

/*
initial conf table
*/
$.getJSON('./client/VFD-B.json', (data) => {
  let a = $('#mmtable tbody');
  testD = data;
  for (let i = 0; i < testD.stps.mltLvl.length; i++) {
    a.append('<tr><th>' + (i + 1) + '</th><td></td><td></td><td></td></tr>');
    a[0].rows[i].cells[1].innerText = testD.stps.mltLvl[i][0];
    a[0].rows[i].cells[2].innerText = parseInt(testD.stps.mltLvl[i][1] / 60);
    a[0].rows[i].cells[3].innerText = testD.stps.mltLvl[i][1] % 60;
  }
  $('#stts-table tbody tr td')[5].innerText = testD.stps.loop;
  $('#mmtable').editableTableWidget();
  a = testD.stps.loop * ($('#mmtable tfoot tr th')[2] * 60 + $('#mmtable tfoot tr th')[3]);
  $('#mmtable tfoot tr th')[6].innerText = parseInt(a / 60);
  $('#mmtable tfoot tr th')[7].innerText = parseInt(a % 60);
  $('#stpsloop')[0].innerText = parseInt(testD.stps.loop);
  //$('#stsloop').innerText = parseInt(testD.stps.loop);
  a = $('#linear-table tbody tr td');

  a[0].innerText = testD.linear.strt;
  a[1].innerText = testD.linear.end;
  a[2].innerText = testD.linear.loop;
  a[3].innerText = testD.linear.tm;
  $('#linear-table tfoot tr th')[1].innerText = parseInt(testD.linear.tm * testD.linear.loop / 60) + ' 时' + (testD.linear.tm * testD.linear.loop % 60) + ' 分';
  $('#linear-table').editableTableWidget();
  a = $('#log-table tbody tr td');
  a[0].innerText = testD.lgrm.strt;
  a[1].innerText = testD.lgrm.end;
  a[2].innerText = testD.lgrm.loop;
  a[3].innerText = testD.lgrm.tm;
  $('#log-table tfoot tr th')[1].innerText = parseInt(testD.lgrm.tm * testD.lgrm.loop / 60) + ' 时' + (testD.lgrm.tm * testD.lgrm.loop % 60) + ' 分';
  $('#log-table').editableTableWidget();

  $('#mmtable tbody tr').find('td').on('change', () => {
    updtStpTm();
  });

  a = $('#fix-table tbody tr td');
  a[0].innerText = testD.fixed.Hz;
  a[1].innerText = testD.fixed.Arith;
  $('#fix-table').editableTableWidget();

  updtStpTm();
  updtTooltip();
});



/*
Websocket switch for different run mode
*/
const wsSweep = (loStp) => {
  let a = $('#stts-table tbody tr td')[10].innerText - Math.ceil(loStp[0] / 2 - 1);
  $('#stts-table tbody tr td')[8].innerText = a;
};

const wsStps = (loStp) => {
  $('#stts-table tbody tr td')[8].innerText = loStp[0] + 1;
  $('#stts-table tbody tr td')[11].innerText = loStp[1];
};

const wsFix = () => { };

let wsSwtch = wsFix;

/*
socket reconnection while error or disconect
websocket onmessage event update status
*/
function rcws() {
  socket = new WebSocket('ws://' + window.location.hostname + ':8887');
  socket.onmessage = function (msg) {
    let a = JSON.parse(msg.data);
    $('#stts-table tbody tr td')[2].innerText = a.SV;
    $('#062001').innerText = a.SV;
    wsSwtch(a.loStp);
    if ((parseInt(a.stts.slice(0, 2), 16) & 0x10) == 0x10) {
      $('#stts-table tbody tr td')[0].style.backgroundColor = "red";
      $('#stts-table tbody tr td')[0].innerText = "运转";
      DT.push(a.DT);
      //PV.push(a.PV);
      Hz.push(a.SV);
      HzBarC.setOption({
        xAxis: {
          data: DT
        },

        series: [
          {
            name: 'Hz',
            type: 'line',
            step: 'middle',
            data: Hz
          }
        ]
      });
      return;
    }
    $('#stts-table tbody tr td')[0].style.backgroundColor = 'green';
    $('#stts-table tbody tr td')[0].innerText = "停止";
  };
  /*
  websocket onclose event trigger reconnect every 5 seconds
  onopen clear timer
  */
  socket.onclose = () => {
    if (!t1) {
      t1 = setInterval(rcws, 5000);
    }
  };

  socket.onopen = () => {
    if (t1) {
      clearInterval(t1);
      t1 = 0;
    }
  };
  /*
  window onclose event trigger websocket close gracefully
  */
  $(window).on('beforeunload', () => {
    socket.close();
  });


}

function updtStts(data) {
  $('#stsLight').show();
  let vfdb = JSON.parse(data);
  switch (vfdb.runMode) {
    case '定频':
      wsSwtch = wsFix;
      $('#stts-table tbody tr td')[1].innerText = '定频';
      $('#stts-table tbody tr td')[3].innerText = vfdb.strtTime;
      $('#stts-table tbody tr')[5].hidden = true;
      $('#stts-table tbody tr')[6].hidden = true;
      $('#stts-table tbody tr')[7].hidden = true;
      break;

    case '对数':
      wsSwtch = wsSweep;
      $('#stts-table tbody tr td')[1].innerText = vfdb.runMode;
      $('#stts-table tbody tr td')[3].innerText = vfdb.strtTime;
      $('#stts-table tbody tr td')[4].innerText = vfdb.endTime;
      $('#stts-table tbody tr td')[2].innerText = parseInt(vfdb.Ttm / 60) + ' 时' + (vfdb.Ttm % 60) + ' 分';
      $('#stts-table tbody tr td')[5].innerText = vfdb.strtHz;
      $('#stts-table tbody tr td')[7].innerText = vfdb.endHz;
      $('#stts-table tbody tr td')[10].innerText = vfdb.loops;
      $('#stts-table tbody tr')[5].hidden = false;
      $('#stts-table tbody tr')[6].hidden = false;
      $('#stts-table tbody tr')[7].hidden = true;
      break;
    case '线性':
      wsSwtch = wsSweep;
      $('#stts-table tbody tr td')[1].innerText = vfdb.runMode;
      $('#stts-table tbody tr td')[3].innerText = vfdb.strtTime;
      $('#stts-table tbody tr td')[4].innerText = vfdb.endTime;
      //$('#stts-table tbody tr td')[2].innerText = parseInt(vfdb.Ttm / 60) + ' 时' + (vfdb.Ttm % 60) + ' 分';
      $('#stts-table tbody tr td')[5].innerText = vfdb.strtHz;
      $('#stts-table tbody tr td')[7].innerText = vfdb.endHz;
      $('#stts-table tbody tr td')[10].innerText = vfdb.loops;
      $('#stts-table tbody tr')[5].hidden = false;
      $('#stts-table tbody tr')[6].hidden = false;
      $('#stts-table tbody tr')[7].hidden = true;

      break;
    case '多阶':
      wsSwtch = wsStps;
      $('#stts-table tbody tr td')[1].innerText = vfdb.runMode;
      $('#stts-table tbody tr td')[3].innerText = vfdb.strtTime;
      $('#stts-table tbody tr td')[4].innerText = vfdb.endTime;
      //$('#stts-table tbody tr td')[2].innerText = parseInt(vfdb.Ttm / 60) + ' 时' + (vfdb.Ttm % 60) + ' 分';
      $('#stts-table tbody tr td')[5].innerText = vfdb.strtHz;
      $('#stts-table tbody tr td')[7].innerText = vfdb.endHz;
      $('#stts-table tbody tr td')[10].innerText = vfdb.loops;
      $('#stts-table tbody tr td')[13].innerText = vfdb.lvls;
      $('#stts-table tbody tr')[5].hidden = false;
      $('#stts-table tbody tr')[6].hidden = false;
      $('#stts-table tbody tr')[7].hidden = false;
      break;

    case '外控':

      break;
    default:
      $('#stts-table tbody tr td')[0].innerText = '';
      break;
  }
}



function run(md) {
  clearChart();
  $.get('./' + md, (data) => {
    updtStts(data);
  });

}

function stop() {
  $.get('/stop');
}

function LRCchk(cmd) {
  let a = cmd.match(/../g).map(x => parseInt(x, 16));
  let b = a.reduce((x, y) => x + y);
  let lrc = ((b - 1) ^ 0xFF).toString(16).toUpperCase();
  lrc = lrc.padStart(2, '0').slice(-2);
  return lrc;
}
/*
render echarts history data
*/
function parseHis(result) {
  for (let i = 0; i < result.length; i++) {
    DT[i] = new Date(result[i].DateTime).toLocaleString();
    PV[i] = result[i].PV;
    Hz[i] = result[i].SV;
  }
  HzBarC.setOption({
    xAxis: {
      data: DT
    },
    series: [
      {
        name: 'Hz',
        type: 'line',
        step: 'middle',
        data: Hz
      }
    ]
  });
  rcws();
}

function clearChart() {
  DT = [];
  Hz = [];
  HzBarC.setOption({
    xAxis: {
      data: DT
    },
    series: [
      { data: Hz }
    ]
  }
  );
}




/*
function executed immediatly
*/

$("#fEC").ECalendar({
  type: "time",
  //stamp:false,
  offset: [10, 2],
  format: "yyyy-mm-dd hh:ii",
  skin: 3,
  step: 10
});
$("#tEC").ECalendar({
  type: "time",
  //stamp:false,
  offset: [10, 2],
  format: "yyyy-mm-dd hh:ii",
  skin: 1,
  step: 10
});

$('#runB').bind('click', function () {
  clearChart();
  run();
});

$('#stopB').bind('click', function () {
  stop();

});


$('#getHisB').click(() => {
  let url = `http://${window.location.hostname}:8889/getHis/${$('#fEC').val()}/${$('#tEC').val()}`;
  clearChart();
  $.get(url, (result) => {
    parseHis(result);
  });
});

$('.setB').bind('click', function () {
  let v = parseInt($('#' + VFDBcmd[this.id][0]).val()) * VFDBcmd[this.id][1];
  v = v.toString(16).padStart(4, '0');
  let cmd = VFDBcmd.MNo + VFDBcmd[this.id][0] + v.toUpperCase();
  cmd += LRCchk(cmd);
  console.log(cmd);
  $.get('/test/' + cmd);
});

$('.dropdown-item').bind('click', function () {
  clearChart();
  run(this.id);
});


$('#stpup').click(() => {
  $('#062001')[0].stepUp(5);
  $('#setSV').click();
});

$('#stpdown').click(() => {
  $('#062001')[0].stepDown(5);
  $('#setSV').click();
});


/*
calculate the stps single loop and total loop time
*/

function updtStpTm() {
  let total = 0;
  let a = $('#mmtable tbody tr');
  for (let i = 0; i < a.length; i++) {
    total += parseInt(a[i].cells[2].innerText * 60) + parseInt(a[i].cells[3].innerText);
  }
  testD.stps.tm = total;
  $('#mmtable tfoot tr')[0].cells[2].innerText = parseInt(total / 60);
  $('#mmtable tfoot tr')[0].cells[3].innerText = parseInt(total % 60);
  $('#mmtable tfoot tr')[1].cells[2].innerText = parseInt(total * $('#stpsloop')[0].innerText / 60);
  $('#mmtable tfoot tr')[1].cells[3].innerText = parseInt(total * $('#stpsloop')[0].innerText % 60);
  updtTooltip();
}

$('#aRow').click(() => {
  $("#mmtable tbody tr:last").after('<tr><th>' + ($("#mmtable tbody tr").length + 1) + '</th><td>0</td><td>0</td><td>0</td></tr>');
  $('#mmtable').editableTableWidget();
  $('#mmtable tbody tr').find('td').on('change', () => {
    updtStpTm();
  });
  updtStpTm();
});

$('#dRow').click(() => {
  $('#mmtable tbody tr:last').remove();
  $('#mmtable').editableTableWidget();
  $('#mmtable tbody tr').find('td').on('change', () => {
    updtStpTm();
  });
  updtStpTm();
  return false;
});
/*
update conf data to server
*/
$('.updt').click(() => {
  let y = [];

  for (let i = 0; i < $('#mmtable tbody tr').length; i++) {
    let x = [];
    let t;
    x.push(parseInt($('#mmtable tbody tr')[i].children[1].innerText));
    t = parseInt($('#mmtable tbody tr')[i].children[2].innerText * 60) + parseInt($('#mmtable tbody tr')[i].children[3].innerText);
    x.push(t);
    y.push(x);
  }
  testD.stps.mltLvl = y;
  testD.stps.loop = parseInt($('#stpsloop')[0].innerText);
  testD.stps.tm = $('#mmtable tfoot tr td')[1] * 60 + $('#mmtable tfoot tr td')[2];
  testD.lgrm.strt = parseInt($('#log-table tbody tr')[0].children[0].innerText);
  testD.lgrm.end = parseInt($('#log-table tbody tr')[0].children[1].innerText);
  //testD.lgrm.end > testD.lgrm.strt ? testD.lgrm.drc = 1: testD.lgrm.drc = -1;
  testD.lgrm.span = Math.abs(parseInt($('#log-table tbody tr')[0].children[0].innerText - $('#log-table tbody tr')[0].children[1].innerText));
  testD.lgrm.loop = parseInt($('#log-table tbody tr')[0].children[2].innerText);
  testD.lgrm.tm = parseInt($('#log-table tbody tr')[0].children[3].innerText);
  testD.linear.strt = parseInt($('#linear-table tbody tr')[0].children[0].innerText);
  testD.linear.end = parseInt($('#linear-table tbody tr')[0].children[1].innerText);
  testD.linear.loop = parseInt($('#linear-table tbody tr')[0].children[2].innerText);
  testD.linear.tm = parseInt($('#linear-table tbody tr')[0].children[3].innerText);
  testD.fixed.Hz = parseInt($('#fix-table tbody tr td')[0].innerText);
  testD.fixed.Arith = parseInt($('#fix-table tbody tr td')[1].innerText);
  let data = JSON.stringify(testD);
  $.ajax({
    type: 'POST',
    url: '/saveConf',
    contentType: 'application/json',
    data: data
  }).done((res) => {
    $('.updtAlert').css('display', 'inline-block');
    $('.updtAlert').html(res);
    $('.updtAlert').fadeTo(1000, 500).slideUp(500, () => {
      $('.updtAlert').slideUp(500);
    });
  });
});
/*
change the css file
*/
$("#ssS").change(() => {
  $("#sheet").attr("href", $("#ssS").val());
});

/*
Change line color
*/

function updtColor(clr) {
  let a = {
    series: {
      name: "Hz",
      type: "line",
      itemStyle: {
        normal: {
          color: "red"
        }
      }
    }
  }

  a.series.itemStyle.normal.color = clr;
  HzBarC.setOption(a);
}


/*
modal & menu draggable
*/

$('.modal').draggable({
  handle: ".modal-header,.modal-footer"
})
/*
$('#mltLvlModal').draggable({
  handle: ".modal-header,.modal-footer"
})
*/
/*
update tooltip content
*/
function updtTooltip() {
  $('.opL:eq(1)').attr('data-original-title', $('#log-table').html())
  $('.opL:eq(2)').attr('data-original-title', $('#linear-table').html());
  $('.opL:eq(3)').attr('data-original-title', $('#mmtable').html())
}

$(function () {
  $("[data-toggle='tooltip']").tooltip();
});
/*
update linear and log execution time
*/
$('#linear-table tbody tr').find('td').on('change', () => {
  let a = $('#linear-table tbody tr td')[2].innerText * $('#linear-table tbody tr td')[3].innerText;
  $('#linear-table tfoot th')[1].innerText = parseInt(a / 60) + ' 时' + (a % 60) + ' 分';
  updtTooltip();
});

$('#log-table tbody tr').find('td').on('change', () => {
  let a = $('#log-table tbody tr td')[2].innerText * $('#log-table tbody tr td')[3].innerText;
  $('#log-table tfoot th')[1].innerText = parseInt(a / 60) + ' 时' + (a % 60) + ' 分';
  updtTooltip();
});

$('#stpsloop').on('change', () => {
  updtStpTm();
});

//$('#stpsloop').on('change',()=>{console.log('change')})

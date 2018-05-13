//const xmlhttp = new XMLHttpRequest();
//let socket = new WebSocket('ws://' + window.location.hostname + ':8887');
let socket;
let HzBarC;
let t1 = 0;
let DT = [],
  PV = [],
  Hz = [];
let testD;
let echartOption = {};
/*
xmlhttp.onreadystatechange = function () {
  if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
    console.log(xmlhttp.response);
  }
};
*/
function rcws() {
  socket = new WebSocket('ws://' + window.location.hostname + ':8887');
  socket.onmessage = function (msg) {
    let a = JSON.parse(msg.data);
    $('#time-table tr td')[3].innerText = a.SV;
    $("#SDT").text(a.DT);
    $("#HzPV").text(a.PV);
    $("#HzSV").text(a.SV);
    $('#dashboard tbody tr td')[0].innerText = a.SV;
    $('#dashboard tbody tr td')[1].innerText = a.runMode;
    $("#HzSts").text(a.stts);
    if ((parseInt(a.stts.slice(0, 2), 16) & 0x10) == 0x10) {
      $('#stsLight').css('background-color','red');
      $('#stsLight').text("运转");
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
    $('#stsLight').css('background-color','green');
    $('#stsLight').text("停止");
  };

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

  $(window).on('beforeunload',()=>{
    socket.close();
  });


}
//rcws();

function run() {
  $.get($('input[name=opMode]:checked').val(),(data)=>{
    $('#opMode-table tbody tr td')[0].innerText = data;
  });
}

function stop() {
  $.get('/stop');
  /*
  xmlhttp.open("GET", '/stop', true);
  xmlhttp.responseType = 'text';
  xmlhttp.send();
  */
}

function LRCchk(cmd) {
  let a = cmd.match(/../g).map(x => parseInt(x, 16));
  let b = a.reduce((x, y) => x + y);
  let lrc = ((b - 1) ^ 0xFF).toString(16).toUpperCase();
  lrc = lrc.padStart(2, '0').slice(-2);
  return lrc;
}

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
        lineStyle:{
          color: '#454345'
        },
        data: Hz
      }
    ]
  });
  rcws();
}

function clearChart() {
  //location.reload();
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


let VFDBcmd;

$.getJSON('./client/VFDBcmd.json', (data) => {
  VFDBcmd = data;
});

$(function () {
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
/*
  $('#testB').bind('click', function () {
    let a = LRCchk($('#test').val());
    console.log(a);
    xmlhttp.open("GET", '/test/:' + $('#test').val() + a, true);
    xmlhttp.responseType = 'text';
    xmlhttp.send();
  });

*/
  $('#stopB').bind('click', function () {
    stop();
    /*
    xmlhttp.open("GET", '/stop', true);
    xmlhttp.responseType = 'text';
    xmlhttp.send();
    */
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
    /*
    xmlhttp.open("GET", '/test/' + cmd, true);
    xmlhttp.responseType = 'text';
    xmlhttp.send();
    */
  });
/*
  $('#setHzTxt').keyup(function (event) {
    if (event.keyCode === 13) {
      xmlhttp.open("GET", '/setHz/' + $('#setHzTxt').val(), true);
      xmlhttp.responseType = 'text';
      xmlhttp.send();
    }
  });
*/
  $('#stpup').click(() => {
    $('#062001')[0].stepUp(5);
    $('#setSV').click();
  });

  $('#stpdown').click(() => {
    $('#062001')[0].stepDown(5);
    $('#setSV').click();
  });

  $.getJSON('./client/VFD-B.json', (data) => {
    let a = $('#mmtable tbody');
    testD = data;
    for (let i = 0; i < testD.stps.mltLvl.length; i++) {
      a.append('<tr><th>' + (i + 1) + '</th><td></td><td></td><td></td></tr>');
      a[0].rows[i].cells[1].innerText = testD.stps.mltLvl[i][0];
      a[0].rows[i].cells[2].innerText = parseInt(testD.stps.mltLvl[i][1] / 60);
      a[0].rows[i].cells[3].innerText = testD.stps.mltLvl[i][1] % 60;
    }
    $('#stpsloop').val(testD.stps.loop);
    $('#mmtable').editableTableWidget();
    $('#mmtable').editableTableWidget().numericInputExample();//.find('td:second').focus();

    a = $('#linear-table tbody tr td');

    a[0].innerText = testD.linear.strt;
    a[1].innerText = testD.linear.end;
    a[2].innerText = testD.linear.loop;
    a[3].innerText = testD.linear.tm / 60;
    $('#linear-table').editableTableWidget();
    
    a = $('#log-table tbody tr td');
    a[0].innerText = testD.lgrm.strt;
    a[1].innerText = testD.lgrm.end;
    a[2].innerText = testD.lgrm.loop;
    a[3].innerText = testD.lgrm.tm / 60;
    $('#log-table').editableTableWidget();
    a = $('#general-table tbody tr td')
    a[0].innerText = testD.expInfo.expName;
    a[1].innerText = testD.expInfo.prdName;
    a[2].innerText = testD.expInfo.prdSn;
    a[3].innerText = testD.expInfo.memo;
    $('#general-table').editableTableWidget();
    $('#exp-table tr td')[0].innerText = testD.expInfo.expName;
    $('#exp-table tr td')[1].innerText = testD.expInfo.prdName;
    $('#exp-table tr td')[2].innerText = testD.expInfo.prdSn;
    $('#exp-table tr td')[0].innerText = testD.expInfo.expName;
    $('#memo-table p')[0].innerText = testD.expInfo.memo;

    updtTooltip();
  });

  $.getJSON('./client/echarts.json', (data) => {
    echartOption = data;
    HzBarC.setOption(
      echartOption.default
    );
  });


  $('#aRow').click(() => {
    $("#mmtable tbody tr:last").after('<tr><th>' + ($("#mmtable tbody tr").length + 1) + '</th><td>0</td><td>0</td><td>0</td></tr>');
    $('#mmtable').editableTableWidget().numericInputExample();
  });

  $('#dRow').click(() => {
    $('#mmtable tbody tr:last').remove();
    $('#mmtable').editableTableWidget().numericInputExample();
    return false;
  });

  $('#updt').click(() => {
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
    testD.stps.loop = parseInt($('#stpsloop').val());
    testD.lgrm.strt = parseInt($('#log-table tbody tr')[0].children[0].innerText);
    testD.lgrm.end = parseInt($('#log-table tbody tr')[0].children[1].innerText);
    //testD.lgrm.end > testD.lgrm.strt ? testD.lgrm.drc = 1: testD.lgrm.drc = -1;
    testD.lgrm.span = Math.abs(parseInt($('#log-table tbody tr')[0].children[0].innerText - $('#log-table tbody tr')[0].children[1].innerText));
    testD.lgrm.loop = parseInt($('#log-table tbody tr')[0].children[2].innerText);
    testD.lgrm.tm = parseInt($('#log-table tbody tr')[0].children[3].innerText) * 60;
    testD.linear.strt = parseInt($('#linear-table tbody tr')[0].children[0].innerText);
    testD.linear.end = parseInt($('#linear-table tbody tr')[0].children[1].innerText);
    testD.linear.loop = parseInt($('#linear-table tbody tr')[0].children[2].innerText);
    testD.linear.tm = parseInt($('#linear-table tbody tr')[0].children[3].innerText) * 60;
    testD.expInfo.expName = $('#general-table tbody tr td')[0].innerText;
    testD.expInfo.prdName = $('#general-table tbody tr td')[1].innerText;
    testD.expInfo.prdSn = $('#general-table tbody tr td')[2].innerText;
    testD.expInfo.memo = $('#general-table tbody tr td')[3].innerText;
    let data = JSON.stringify(testD);
    $.ajax({
      type:'POST',
      url:'/saveConf',
      contentType:'application/json',
      data:data
    }).done((res)=>{
      $('#updtAlert').css('display','inline-block');
      $('#updtAlert').html(res);
      $('#updtAlert').fadeTo(2000,500).slideUp(500,()=>{
        $('#updtAlert').slideUp(500);
      });
    });
  });

  $("#ssS").change(() => {
    $("#sheet").attr("href", $("#ssS").val());
  });

/*   $('.opL').change(()=>{
    switch ($('input[name=opMode]:checked').val()){
      case '/runLoga':{
        $('#dashboard tbody tr')[0].children[4].innerText = testD.lgrm.tm/60;
        $('#dashboard tbody tr')[0].children[5].innerText = testD.lgrm.loop;
        $('#dashboard tbody tr')[0].children[6].innerText = testD.lgrm.strt;
        $('#dashboard tbody tr')[0].children[7].innerText = testD.lgrm.strt + testD.lgrm.span;
        $('#dashboard tbody tr')[0].children[8].innerText = '对数扫频';
        break;
      }

      case '/runLinear':{
        $('#dashboard tbody tr')[0].children[4].innerText = testD.linear.tm/60;
        $('#dashboard tbody tr')[0].children[5].innerText = testD.linear.loop;
        $('#dashboard tbody tr')[0].children[6].innerText = testD.linear.strt;
        $('#dashboard tbody tr')[0].children[7].innerText = testD.linear.end;
        $('#dashboard tbody tr')[0].children[8].innerText = '线性扫频';
        break;
      }
      default:{
        break;
      }
    }
  });
 */

  HzBarC = echarts.init($('#HzBarC')[0]);

  (() => {
    $.get('http://' + window.location.hostname + ':8889/getRT', (result) => {
      parseHis(result);
    }).fail(()=>{
      rcws();
      alert('数据库断线，无法记录数据，请联系供应商');
    });
})();


  /*
  modal draggable
  */

  $('#opModal').draggable({
    handle: ".modal-header"
  })

  $('#confModal').draggable({
    handle: ".modal-header"
  })

  $('#menuBtn').draggable();

  function updtTooltip(){
    $('.opL:eq(1)').attr('data-original-title', $('#log-table').html())
    $('.opL:eq(2)').attr('data-original-title', $('#linear-table').html());
    $('.opL:eq(3)').attr('data-original-title', $('#mmtable').html())
  }




  $(function(){
    $("[data-toggle='tooltip']").tooltip();
  });
});

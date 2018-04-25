let xmlhttp = new XMLHttpRequest();
let socket = new WebSocket('ws://suzhou.kenjichen.com:8887');
//let socket;// = new WebSocket('ws://192.168.0.11:8887');
let HzBarC;
let t1 = 0;
let DT = [],
  PV = [],
  SV = [];
let testD;
xmlhttp.onreadystatechange = function () {
  if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
    console.log(xmlhttp.response);
  }
};

function rcws() {

  socket = new WebSocket('ws://suzhou.kenjichen.com:8887');

  socket.onmessage = function (msg) {
    let a = JSON.parse(msg.data);
    $("#SDT").text(a.DT);
    $("#HzPV").text(a.PV);
    $("#HzSV").text(a.SV);
    $('#dashboard tbody tr')[0].children[0].innerText = a.SV;
    $("#HzSts").text(a.stts);
    if ((parseInt(a.stts.slice(0, 2), 16) & 0x10) == 0x10) {
      DT.push(a.DT);
      //PV.push(a.PV);
      SV.push(a.SV);
      HzBarC.setOption({
        xAxis: {
          data: DT
        },
        series: [{
          name: 'PV',
          type: 'line',
          data: PV
        },
        {
          name: 'SV',
          type: 'line',
          step: 'middle',
          data: SV
        }
        ]
      });
    }
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


}
rcws();

function run() {
  xmlhttp.open("GET", '/run', true);
  xmlhttp.responseType = 'text';
  xmlhttp.send();
}

function stop() {
  xmlhttp.open("GET", '/stop', true);
  xmlhttp.responseType = 'text';
  xmlhttp.send();
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
    SV[i] = result[i].SV;
  }
  HzBarC.setOption({
    xAxis: {
      data: DT
    },
    series: [{
      name: 'PV',
      type: 'line',
      data: PV
    },
    {
      name: 'SV',
      type: 'line',
      step: 'middle',
      data: SV
    }
    ]
  });
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
});
$(document).ready(function () {





  $('#runB').bind('click', function () {
    xmlhttp.open("GET", $('input[name=opMode]:checked').val(), true);
    xmlhttp.responseType = 'text';
    xmlhttp.send();
  });

  $('#testB').bind('click', function () {
    let a = LRCchk($('#test').val());
    console.log(a);
    xmlhttp.open("GET", '/test/:' + $('#test').val() + a, true);
    xmlhttp.responseType = 'text';
    xmlhttp.send();
  });


  $('#stopB').bind('click', function () {
    xmlhttp.open("GET", '/stop', true);
    xmlhttp.responseType = 'text';
    xmlhttp.send();
  });

  $('#runStpsB').click(() => {
    xmlhttp.open("GET", '/stps', true);
    xmlhttp.responseType = "text";
    xmlhttp.send();
  });


  $('#getHisB').click(() => {
    let url = `http://suzhou.kenjichen.com:8889/getHis/${$('#fEC').val()}/${$('#tEC').val()}`;
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
    xmlhttp.open("GET", '/test/' + cmd, true);
    xmlhttp.responseType = 'text';
    xmlhttp.send();
    /*
         $.get('/test/:' + cmd,function(data){
            console.log(data);
           });
    */
  });

  $('#setHzTxt').keyup(function (event) {
    if (event.keyCode === 13) {
      xmlhttp.open("GET", '/setHz/' + $('#setHzTxt').val(), true);
      xmlhttp.responseType = 'text';
      xmlhttp.send();
    }
  });

  $('#stpup').click(() => {
    $('#062001')[0].stepUp(5);
    $('#setSV').click();
  });

  $('#stpdown').click(() => {
    $('#062001')[0].stepDown(5);
    $('#setSV').click();
  });
  
  $.getJSON('./client/VFD-B.json', (data) => {
    let a = document.getElementById('mmtable');
    testD = data;
    for (let i = 0; i < testD.stps.mltLvl.length; i++) {
      a.children[1].insertAdjacentHTML('beforeEnd', '<tr><th>' + (a.children[1].children.length + 1) + '</th><td></td><td></td><td></td></tr>');
      a.children[1].children[i].children[1].innerText = testD.stps.mltLvl[i][0];
      a.children[1].children[i].children[2].innerText = parseInt(testD.stps.mltLvl[i][1] / 60);
      a.children[1].children[i].children[3].innerText = testD.stps.mltLvl[i][1] % 60;
    }
    $('#stpsloop').val(testD.stps.loop);
    $('#mmtable').editableTableWidget();
    $('#mmtable').editableTableWidget().numericInputExample();//.find('td:second').focus();

    a = document.getElementById('linear-table');

    a.children[1].children[0].children[0].innerText = testD.linear.strt;
    a.children[1].children[0].children[1].innerText = testD.linear.end;
    a.children[1].children[0].children[2].innerText = testD.linear.loop;
    a.children[1].children[0].children[3].innerText = testD.linear.tm;
    $('#linear-table').editableTableWidget();
    a = document.getElementById('log-table');
    a.children[1].children[0].children[0].innerText = testD.lgrm.strt;
    a.children[1].children[0].children[1].innerText = testD.lgrm.span + testD.lgrm.strt;
    a.children[1].children[0].children[2].innerText = testD.lgrm.loop;
    a.children[1].children[0].children[3].innerText = testD.lgrm.tm;
    $('#log-table').editableTableWidget();
    
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
    console.log(y);
    testD.stps.mltLvl = y;
    testD.stps.loop = parseInt($('#stpsloop').val());
    testD.lgrm.strt = parseInt($('#log-table tbody tr')[0].children[0].innerText);
    testD.lgrm.span = Math.abs(parseInt($('#log-table tbody tr')[0].children[0].innerText - $('#log-table tbody tr')[0].children[1].innerText));
    testD.lgrm.loop = parseInt($('#log-table tbody tr')[0].children[2].innerText);
    testD.lgrm.tm = parseInt($('#log-table tbody tr')[0].children[3].innerText);
    testD.linear.strt = parseInt($('#linear-table tbody tr')[0].children[0].innerText);
    testD.linear.end = parseInt($('#linear-table tbody tr')[0].children[1].innerText);
    testD.linear.loop = parseInt($('#linear-table tbody tr')[0].children[2].innerText);
    testD.linear.tm = parseInt($('#linear-table tbody tr')[0].children[3].innerText);
    let data = JSON.stringify(testD);
    xmlhttp.open("POST", "/saveConf", true);
    xmlhttp.setRequestHeader("Content-type", "application/json");
    xmlhttp.send(data);
    /*
      $.post('/saveConf',(testD,status)=>{
         console.log(status);
      },'json');
    */
  });



  $("#ssS").change(() => {
    $("#sheet").attr("href", $("#ssS").val());
  });


  HzBarC = echarts.init($('#HzBarC')[0]);
  HzBarC.setOption({
    title: {
      text: '振动频率图text',
    },
    legend: {
      data: ['PV', 'SV']
    },
    tooltip: {
      trigger: 'axis'
    },
    toolbox: {
      show: true,
      feature: {
        dataView: {
          readOnly: false
        },
        restore: {},
        saveAsImage: {}
      }
    },
    dataZoom: [{
      type: 'slider',
      xAxisIndex: 0,
      start: 0,
      end: 100
    },
    {
      type: 'slider',
      yAxisIndex: 0,
      filterMode: 'empty',
      start: 0,
      end: 100
    },
    {
      type: 'inside',
      yAxisIndex: 0,
      filterMode: 'empty'
    }
    ],

    xAxis: {
      data: []
    },
    yAxis: [{
      type: 'value',
      name: 'Hz',
      min: 0,
      max: 100,
      maxInterval: 10,
      position: 'left',
      axisLabel: {
        formatter: '{value} Hz',
        textStyle: {
          color: '#fbafaf'
        }
      }
    }],
    series: [{
      name: 'PV',
      type: 'line',
      data: []
    },
    {
      name: 'SV',
      type: 'line',
      step: 'middle',
      itemStyle: {
        normal: {
          color: "#ff715e"
        }
      },
      data: []
    }
    ]
  });

/*
modal draggable
*/

$('#opModal').draggable({
  handle:".modal-header"
})

$('#confModal').draggable({
  handle:".modal-header"
})

});

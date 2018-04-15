let xmlhttp = new XMLHttpRequest();
let socket = new WebSocket('ws://suzhou.kenjichen.com:8887');
//let socket;// = new WebSocket('ws://192.168.0.11:8887');
let HzBarC;
let t1 = 0;
let DT=[],PV=[],SV=[];
xmlhttp.onreadystatechange = function (){
  if(xmlhttp.readyState == 4 && xmlhttp.status == 200){
    console.log(xmlhttp.response);
  }
};

function rcws(){

  socket = new WebSocket('ws://suzhou.kenjichen.com:8887');

  socket.onmessage = function(msg){
    let a = JSON.parse(msg.data);
    $("#SDT").text(a.DT);
    $("#HzPV").text(a.PV);
    $("#HzSV").text(a.SV);
    $("#HzSts").text(a.stts);
    if((parseInt(a.stts.slice(0,2),16) & 0x10) == 0x10){
      DT.push(a.DT);
      //PV.push(a.PV);
      SV.push(a.SV);
      HzBarC.setOption({
        xAxis:{data:DT},
        series:[{
          name:'PV',
          data:PV},
       {name:'SV',
        data:SV}
       ]
      });
   }
  }

  socket.onclose = ()=>{
    console.log("closee");
    if(!t1){
      console.log("15 secs triggered");
      t1 = setInterval(rcws,5000);
    }
  };
  
  socket.onopen = ()=>{
    console.log('opend');
    if(t1){
      clearInterval(t1);
      t1 = 0;
    }
  };
  
  
}
rcws();

function run(){
  xmlhttp.open("GET",'/run',true);
  xmlhttp.responseType = 'text';
  xmlhttp.send();
}

function stop(){
  xmlhttp.open("GET",'/stop',true);
  xmlhttp.responseType = 'text';
  xmlhttp.send();
}

function LRCchk(cmd){
  let a = cmd.match(/../g).map(x=>parseInt(x,16));
  let b = a.reduce((x,y)=>x+y);
  let lrc = ((b - 1) ^ 0xFF).toString(16).toUpperCase();
  lrc = lrc.padStart(2,'0').slice(-2);
  return lrc;
}

function parseHis(result){
  for(let i=0;i<result.length;i++){
    DT[i] = result[i].DateTime;
    PV[i] = result[i].PV;
    SV[i] = result[i].SV;
  }
  HzBarC.setOption({
    xAxis:{data:DT},
    series:[{
      name:'PV',
      data:PV},
   {name:'SV',
    data:SV}
   ]
   },true)
}


let VFDBcmd;

$.getJSON('./client/VFDBcmd.json',(data)=>{
  VFDBcmd = data;
});

$(function(){
   $("#fEC").ECalendar({
      type:"time",
      //stamp:false,
      offset:[10,2],
      format:"yyyy-mm-dd hh:ii",
      skin:3,
      step:10
   });
   $("#tEC").ECalendar({
      type:"time",
      //stamp:false,
      offset:[10,2],
      format:"yyyy-mm-dd hh:ii",
      skin:1,
      step:10
   });
});
$(document).ready(function(){
  $('#runB').bind('click',function(){
    xmlhttp.open("GET",$('input[name=opMode]:checked').val(),true);
    xmlhttp.responseType = 'text';
    xmlhttp.send();
  });

  $('#testB').bind('click',function(){
    let a = LRCchk($('#test').val());
    console.log(a);
    xmlhttp.open("GET",'/test/:' + $('#test').val() + a,true);
    xmlhttp.responseType = 'text';
    xmlhttp.send();
   });

  
  $('#stopB').bind('click',function(){
    xmlhttp.open("GET",'/stop',true);
    xmlhttp.responseType = 'text';
    xmlhttp.send();
   });

  $('#runStpsB').click(()=>{
    xmlhttp.open("GET",'/stps',true);
    xmlhttp.responseType = "text";
    xmlhttp.send();
   });


  $('#getHisB').click(()=>{
    let url = `http://suzhou.kenjichen.com:8889/getHis/${$('#fEC').val()}/${$('#tEC').val()}`;
    $.get(url,(result)=>{
      parseHis(result);
    });
/*
    xmlhttp.open("GET",`http://192.168.0.11:8889/getHis/${$('#fEC').val()}/${$('#tEC').val()}`,true);
    xmlhttp.responseType = "text";
    xmlhttp.send();
*/
  });

  $('.setB').bind('click',function(){
     let v = parseInt($('#' + VFDBcmd[this.id][0]).val()) * VFDBcmd[this.id][1];
     v = v.toString(16).padStart(4,'0');
     let cmd = VFDBcmd.MNo + VFDBcmd[this.id][0] + v.toUpperCase();
     cmd += LRCchk(cmd);
     console.log(cmd);
     xmlhttp.open("GET",'/test/' + cmd ,true);
     xmlhttp.responseType = 'text';
     xmlhttp.send();
/*
     $.get('/test/:' + cmd,function(data){
        console.log(data);
       });
*/  
  });

  $('#setHzTxt').keyup(function(event){
      if(event.keyCode === 13){
        xmlhttp.open("GET",'/setHz/' + $('#setHzTxt').val(),true);
        xmlhttp.responseType ='text';
        xmlhttp.send();
      }
   });

   HzBarC = echarts.init($('#HzBarC')[0]); 
   HzBarC.setOption({
     title:{
       text:'振动频率图text',
     },
     legend:{
       data:['PV','SV']
     },
     tooltip:{
       trigger:'axis'
     },
     toolbox:{
       show:true,
       feature:{
         dataView:{readOnly:false},
         restore:{},
         saveAsImage:{}
       }
     },
     dataZoom:[
       {
        type:'slider',
        xAxisIndex:0,
        start:0,
        end:100
       },
       {
        type:'slider',
        yAxisIndex:0,
        filterMode:'empty',
        start:0,
        end:100
       },
       {
        type:'inside',
        yAxisIndex:0,
        filterMode:'empty'
       }
       ],

     xAxis:{
       data:[]
     },
     yAxis:[
       {
        type:'value',
        name:'Hz',
        min:0,
        max:100,
        maxInterval:10,
        position:'left',
        axisLabel:{
          formatter:'{value} Hz'
        }
      }],
     series:[{
     name:'PV',
     type:'line',
     data:[]},
     {name:'SV',
      type:'line',
      step:'middle',
     data:[]}
     ]
     });
});

let xmlhttp = new XMLHttpRequest();
//let socket = new WebSocket('ws://192.168.0.20:8887');
let socket = new WebSocket('ws://192.168.0.11:8887');

xmlhttp.onreadystatechange = function (){
  if(xmlhttp.readyState == 4 && xmlhttp.status == 200){
    console.log(xmlhttp.response);
  }
};

socket.onmessage = function(msg){
  let a = JSON.parse(msg.data);
  $("#HzPV").text(a.PV);
  $("#HzSV").text(a.SV);
  $("#HzSts").text(a.stts);
}

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
    xmlhttp.open("GET",'/run',true);
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

   let HzBarC = echarts.init($('#HzBarC')[0]); 

   HzBarC.setOption({
     title:{
       text:'振动频率图text',
       subtext:'sub text'
     },
     legend:{
       data:['振动PV_Legend','振动SV']
     },
     tooltip:{
       trigger:'axis'
     },
     dataZoom:[
       {
        type:'slider',
        xAxisIndex:0,
        start:80,
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

     },
     yAxis:[
       {
        type:'value',
        name:'Hz',
        min:0,
        max:100,
        position:'left',
        axisLabel:{
          formatter:'{value} Hz'
        }
      }]
     });
});

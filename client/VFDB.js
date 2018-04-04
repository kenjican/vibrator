let xmlhttp = new XMLHttpRequest();
//let socket = new WebSocket('ws://192.168.0.20:8887');
let socket = new WebSocket('ws://192.168.0.11:8887');

xmlhttp.onreadystatechange = function (){
  if(xmlhttp.readyState == 4 && xmlhttp.status == 200){
    console.log(xmlhttp.response);
  }
};

socket.onmessage = function(msg){
  let VFDB = JSON.parse(msg.data);
  $("#HzPV").text(VFDB.PV);
  $("#HzSV").text(VFDB.SV);
  $("#HzSts").text(VFDB.stts);
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
    
  $('#stopB').bind('click',function(){
    xmlhttp.open("GET",'/stop',true);
    xmlhttp.responseType = 'text';
    xmlhttp.send();
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

let xmlhttp = new XMLHttpRequest();
/*
xmlhttp.onreadystatechange = function(){
  if(xmlhttp.readyState == 4 && xmlhttp.status == 200){
    let v = JSON.parse(xmlhttp.response);
      switch v[0]
      {
        case "histosry":
          
          break;
        default:
         

      }
 
  }

}

*/
let url = "ws://suzhou.accutherm.com.cn:8887";
//let url = "ws://192.168.0.12:8887";
let user;
let socket;
//let TChart = echarts.init($("#main")[0]);
let option = {
  backgroundColor:'#1b1b1b',
tooltip : {
  formatter: "{a} <br/>{c} {b}"
  },
series : 
  [{
   name:'Temp.',
   type:'gauge',
   min:-50,
   max:100,
   center:['40%','40%'],
   splitNumber:15,
   radius: '200px',
   axisLine: {            // 坐标轴线
   lineStyle: {       // 属性lineStyle控制线条样式
     color: [[0.33, 'lime'],[0.7, '#1e90ff'],[1, '#ff4500']],
     width: 3,
     shadowColor : '#fff', //默认透明
     shadowBlur: 10
     }
   },
   axisLabel: {            // 坐标轴小标记
   textStyle: {       // 属性lineStyle控制线条样式
     fontWeight: 'bolder',
     color: '#fff',
     shadowColor : '#fff', //默认透明
     shadowBlur: 10
     }
   },
   axisTick: {            // 坐标轴小标记
     length :20,        // 属性length控制线长
     lineStyle: {       // 属性lineStyle控制线条样式
       color: 'auto',
       shadowColor : '#fff', //默认透明
       shadowBlur: 10
       }
   },
   splitLine: {           // 分隔线
     length :25,         // 属性length控制线长
     lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
       width:3,
       color: '#fff',
       shadowColor : '#fff', //默认透明
       shadowBlur: 10
       }
    },
    pointer:{           // 分隔线
      length:'100%',
      width:3,
      shadowColor : '#fff', //默认透明
      shadowBlur: 5
      },
  title : {
    fontWeight: 'bolder',
    fontSize: 40,
    fontStyle: 'italic',
    color: '#f00',
    shadowColor : '#fff', //默认透明
    shadowBlur: 10
  },
  detail :{
   // backgroundColor: '#fff',
   // borderWidth: 0,
   // borderColor: '#fff',
    shadowColor : '#fff', //默认透明
    shadowBlur: 5,
    offsetCenter: [0, '50%'],       // x, y，单位px
    fontWeight: 'bolder',
    color: '#f00',
    fontSize:40
   },
           
  data:[{value: 40, name: '温度'},{value:0,name:'TSV'},{value:0,name:'TMV'}]
 },

 {
  name:'Humi',
  type:'gauge',
  center:['16%','45%'],
  radius:'50%',
  min:0,
  max:100,
  splitNumber:10,
  startAngle:325,
  endAngle:45,
//
  axisLine:{
    lineStyle:{
      color:[[0.3,'lime'],[0.7,'#1e90ff'],[1,'#ff4500']],
      width:2,
      shadowColor:'#fff',
      shadowBlur:10
    }
  },
  axisLabel:{
    textStyle:{
      fontWeight:'bolder',
      color:'#fff',
      shadowColor:'#fff',
      shadowBlur:10
    }
  },
  
  axixTick:{
    length:12,
    lineStyle:{
      color:'auto',
      shadowColor:'#fff',
      shadowBlur:10
    }
  },

  splitLine:{
   
  },
  title:{
    color:'#1E90FF',
    fontSize:40

  },
  detail:{
    fontSize:40,
    color:'#1E90FF'

  },
  data:[{value:0,name:'湿度'},{value:0,name:'HSV'},{value:0,name:'HMV'}]
 },

 {
  name:'Hz',
  type:'gauge',
  center:['65%','45%'],
  radius:'50%',
  min:0,
  max:100,
  startAngle:140,
  endAngle:-150,

  axisLine:{
    lineStyle:{
      color:[[0.3,'lime'],[0.7,'#1e90ff'],[1,'#ff4500']],
      width:2,
      shadowColor:'#fff',
      shadowBlur:10
    }
  },
  axisLabel:{
    textStyle:{
      fontWeight:'bolder',
      color:'#fff',
      shadowColor:'#fff',
      shadowBlur:10
    }
  },
  
  axixTick:{
    length:12,
    lineStyle:{
      color:'auto',
      shadowColor:'#fff',
      shadowBlur:10
    }
  },

  splitLine:{
   
  },
  title:{
    color:'#1E90FF',
    fontSize:40

  },
  detail:{
    fontSize:40,
    color:'#1E90FF'

  },
  data:[{value:25,name:'频率'}]

 }
 ]
 
};


let hisChart = {





}



socket = new WebSocket(url);
socket.onmessage = function(msg){
  let StatusData = JSON.parse(msg.data);
  $("#TPV").text((StatusData.AnaData.TPV).toFixed(2));
  $("#TSV").text((StatusData.AnaData.TSV).toFixed(2));
  $("#TMV").text((StatusData.AnaData.TMVV));
  $("#HPV").text((StatusData.AnaData.HPV).toFixed(2))
  $("#HSV").text((StatusData.AnaData.HSV).toFixed(2));
  $("#HMV").text((StatusData.AnaData.HMVV));
  $("#NHR").text(StatusData.AnaData.NHR);
  $("#NMin").text(StatusData.AnaData.NMin);
  $("#NSec").text(StatusData.AnaData.NSec);
  $("#Steps").text(StatusData.AnaData.Steps);
  $("#Patt").text(StatusData.AnaData.Patt);
  $("#GP1").text(StatusData.DigiData.GP1);
  $("#GP2").text(StatusData.DigiData.GP2);
  $("#GP3").text(StatusData.DigiData.GP3);
  option.series[0].data[0].value = $("#TPV").text();
  option.series[0].data[1].value = $("#TSV").text();
  option.series[0].data[2].value = $("#TMV").text();
  option.series[1].data[0].value = $("#HPV").text();
  option.series[1].data[1].value = $("#HSV").text();
  option.series[1].data[2].value = $("#HMV").text();
  TChart.setOption(option,true); 
}
/*
$('#getSteps').bind('click',function(){
  console.log(this.id);
});


$('#getcells').bind('click',function(){
  let cell = document.getElementsByTag('td');
  console.log(cell.length);
});
*/

function fcsSend(cmd){
  cmd = cmd + checkFCS(cmd) + '*\r\n';
  $('#sd').val(cmd);
  console.log($('#sd').val());
  socket.send(cmd);
}

function getSteps(cmd){
  


}


function checkFCS(cmd){
  let fcs = cmd.charCodeAt(0);
  for(let i=1;i<cmd.length;i++){
    fcs = fcs ^ cmd.charCodeAt(i);
  }
  console.log(fcs);
  fcs = '0' + fcs.toString(16).toUpperCase();
  console.log(fcs);
  return fcs.slice(-2);
}

$(document).ready(function(){

$('#getSteps').bind('click',function(){
  alert(this.id);
});

$('#getcells').bind('click',function(){
  let str = $("#EC").val() + "/" + $("#tEC").val();
  console.log(str);
  $.get("/gethis/" + str ,function(data,status){
    console.log(data);
  });
/*
  let cell = document.getElementsByTagName('td');
  alert(cell.length);
*/
});

$('#fcsSend').bind('click',function(){
  fcsSend($('#sd').val());
});

//let TChart = echarts.init($("#main")[0]);
});

'use strict';
const fs = require('fs');
const VFDB = JSON.parse(fs.readFileSync('./VFD-B.json'));
const bodyParser = require('body-parser');
const WebSocketServer = require('ws').Server;
const SP = require('serialport');
const Readline = SP.parsers.Readline;
const express = require('express');
const app = express();
const http = require('http');

/*
Set up serial port
*/

let U1 = new SP('/dev/ttyUSB0',{
  baudRate:VFDB.con.baudRate,
  dataBits:VFDB.con.dataBits,
  stopBits:VFDB.con.stopBits,
  parity:VFDB.con.parity
}); 

let parser = U1.pipe(new Readline({delimiter:'\r\n'}));

parser.on('data',function(data){
  switch (data.length){
    case 21:
      VFDB.sts.stts = parseInt(data.slice(7,11),16);
      VFDB.sts.PV = parseInt(data.slice(15,19),16)/100;
      VFDB.sts.SV = parseInt(data.slice(11,15),16)/100;
      sendsts();
      http.get('http://localhost:8889/insert/'+JSON.stringify(VFDB.sts) ,(res)=>{});
     break;
 //   case :
 //     console.log(data);
 //    break;

    default:
      console.log(data);
      break;

   }
  });

/*
LRC calculation
*/

function LRCchk(cmd){
  let a = cmd.match(/../g).map(x=>parseInt(x,16));
  let b = a.reduce((x,y)=>x+y);
  let LRC = ((b - 1) ^ 0xFF).toString(16).toUpperCase();
  LRC = LRC.padStart(2,'0').slice(-2);
  return LRC;
}

/*
Steps logic and function
*/
let Stps = VFDB.stps;
function runStps(){
  let a = Stps.shift();
  let stpsLength = Stps.length;
  if(stpsLength == 0){
    http.get('http://localhost:8888/setSV/0',(res)=>{
      console.log('zero stop');
    });
    return;
  }

  http.get('http://localhost:8888/setSV/' + a[0],(res)=>
    {
      console.log(a[0]);
    });
  setTimeout(runStps,a[1]*1000);

}


/*
Web
*/

app.use('/client',express.static('./client'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.get('/',function(req,res){
  res.sendFile('/home/kenji/vibrator/index.htm');
});

app.get('/run',function(req,res){
  U1.write(VFDB.cmdASCII.run);
  res.send('run sent');
  res.end;
});

app.get('/stop',function(req,res){
  U1.write(VFDB.cmdASCII.stop);
  res.send('stop sent');
  res.end;
});

app.get('/getPV',function(req,res){
  U1.write(VFDB.cmdASCII.getPV);
});

app.get('/getPSS',function(req,res){
  U1.write(VFDB.cmdASCII.getPSS);
  res.send("ok");
  res.end;
});

app.get('/setSV/:SV',function(req,res){
  let SV2hex = (parseFloat(req.params.SV)*100).toString(16).padStart(4,'0');
  let LRC = LRCchk((VFDB.cmdASCII.setSV).slice(1,) + SV2hex);
  let sSV = VFDB.cmdASCII.setSV + SV2hex + LRC + '\r\n';
  sSV = sSV.toUpperCase();
  //console.log(sSV);
  U1.write(sSV);
  res.send('ok');
  res.end;
});

app.get('/test/:cmd',function (req,res){
  console.log(req.params.cmd);
  U1.write(':' + req.params.cmd +'\r\n');
  res.send(req.params.cmd);
  res.end;
  });

app.get('/stps',function (req,res){
  http.get('http://localhost:8888/run',(res)=>{
    console.log('running');
  });
  runStps();  
  res.end;
  });


function getLocalPSS(){
  http.get('http://localhost:8888/getPSS',(res)=>{
     //console.log(res);
  });
}




app.listen(8888);


/*
Timer
*/

let t1 = setInterval(getLocalPSS,1000);


/*
WebSocket
*/

let wss = new WebSocketServer({port:8887});

function sendsts(){
  wss.clients.forEach((conn)=>{
    conn.send(JSON.stringify(VFDB.sts));
  });
}

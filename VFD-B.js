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
      console.log(data);
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
  let LRC = 0;
  let cmdBuf = Buffer.from(cmd,'hex');
  for(let i=0;i<cmdBuf.length;i++){
    LRC += cmdBuf[i];
  }
 
  LRC = '00' + ((LRC - 1) ^ 0xFF).toString(16);
  return LRC.slice(-2);
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
});

app.get('/stop',function(req,res){
 U1.write(VFDB.cmdASCII.stop);
});

app.get('/getPV',function(req,res){
  U1.write(VFDB.cmdASCII.getPV);
});

app.get('/getPSS',function(req,res){
  U1.write(VFDB.cmdASCII.getPSS);
});

app.get('/setSV/:SV',function(req,res){
  let SV2hex = (parseFloat(req.params.SV)*100).toString(16);
  SV2hex = ('0000' + SV2hex).slice(-4);
  let LRC = LRCchk((VFDB.cmdASCII.setSV).slice(1,) + SV2hex);
  let sSV = VFDB.cmdASCII.setSV + SV2hex + LRC + '\r\n';
  sSV = sSV.toUpperCase();
  console.log(sSV);
  U1.write(sSV);
});


app.listen(8888);


/*
Timer
*/

let t1 = setInterval(()=>{http.get('http://localhost:8888/getPSS')},1000);

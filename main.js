/*
version:0.1
purpose: Communicate with U1 JPS PDAN-2022 YUDIAN AI516
auther: Kenji Chen
date: 2018-Feb-10
*/

"use strict";

let fs = require('fs');
let bodyParser = require('body-parser');
let express = require('express');
let app = express();
let serialP = require('serialport');
//let fs = require('fs');
let mysql = require('mysql');
let U1json = JSON.parse(fs.readFileSync('./AI516.json','utf8'));
let WebSocketServer = require('ws').Server;
let http = require('http');
let wss = new WebSocketServer({port:8887});


function GetCRC(cmdnocrc){
  let CRC = 0xffff;
  let XorConst = 0xA001;

  for(i=0;i<cmdnocrc.length;i++)
{
  CRC = CRC ^ cmdnocrc[i];
  for(j=0;j<=7;j++)
  {
    if (CRC % 2 == 0)
    {
        CRC = CRC / 2;
    }

    else
    {
        CRC = (CRC -1) /2;
        CRC = CRC ^ XorConst;
    }
  }

}
let tempCRC = new Uint8Array(2);
tempCRC[0] = parseInt(CRC.toString(16).substring(2,4),16);
tempCRC[1] = parseInt(CRC.toString(16).substring(0,2),16);

  return tempCRC;
}

serialP.list(function(err,ports){
  ports.forEach(function(port){
    console.log(port.comName);
    console.log(port.pnpId);
    console.log(port.manufacturer);
    console.log(port.locationId);
    console.log(port.venderId);
    console.log(port.productId);
    console.log(port.deviceId);
  });
});

/*
U1 serial command
*/

const ByteLength = serialP.parsers.ByteLength;

const SHzBuf = Buffer.from(U1json.MBs.setHz);

let U1 = new serialP('/dev/ttyUSB0',{
  baudRate:19200,
  dataBits:8,
  stopBits:2,
  parity:'none',
});

/*
let computer = new serialP('./dev/ttyUSB1',{
  baudRate:9600,
  dataBits:8,
  stopBits:1,
  parity:'none'
});
*/

let parser = U1.pipe(new ByteLength({length:8}));

parser.on('data',function(data){
  switch (U1json.cmd){
    case 'SV':
     ()=>{http.get('http://localhost:8888/getHzPV')};
     console.log('SV : ' + data.readIntBE(3,2).toString());
     break;
    case 'PV':
     console.log('PV : ' + data.readIntBE(3,2).toString());
     break;
    default:
     break;
  }
 }
);



/*
web
*/

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.get('/',function(req,res){
  res.sendFile('/home/kenji/vibrator/index.htm');
});

app.listen(8888);

app.get('/run',function(req,res){
  U1.cmd = "run";
  parser = U1.pipe(new ByteLength({length:8}));
  U1.write(Buffer.from(U1json.MBs.run,'hex'));
});

app.get('/stop',function(req,res){
  U1.write(Buffer.from(U1json.MBs.stop,'hex'));
  res.send("sjtooping");
});

app.get('/setHz/:hz',function(req,res){
   let buf = U1json.MBs.setHz + parseInt(req.params.hz + '00',10).toString(16);
   buf = Buffer.from(buf,'hex');
   buf = Buffer.concat([buf,GetCRC(buf)]);
   U1.write(buf);
   res.send();
});

app.get('/zeroHz',function(req,res){
  U1.write(Buffer.from(U1json.MBs.zeroHz,'hex'));
});


app.get('/getHzPV',function(req,res){
 parser = U1.pipe(new ByteLength({length:8}));
  U1json.cmd = "PV";
  U1.write(Buffer.from(U1json.MBs.getHzPV,'hex'));
});

app.get('/getHzSV',function(req,res){
 parser = U1.pipe(new ByteLength({length:8}));
 U1json.cmd = "SV";
  U1.write(Buffer.from(U1json.MBs.getHzSV,'hex'));
});

let t1 = setInterval(()=>{http.get('http://localhost:8888/getHzSV')},1000);

/*
Web Socket
*/



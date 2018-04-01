/*
version:0.1
purpose: Communicate with vibrator JPS PDAN-2022
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
let vibrator1 = JSON.parse(fs.readFileSync('./PDAN.json','utf8'));
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
vibrator serial command
*/

const ByteLength = serialP.parsers.ByteLength;

const SHzBuf = Buffer.from(vibrator1.MBs.setHz);

let vibrator = new serialP('/dev/ttyUSB0',{
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

let parser = vibrator.pipe(new ByteLength({length:7}));

parser.on('data',function(data){
  switch (vibrator1.cmd){
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
  res.sendFile('/home/pi/vibrator/index.htm');
});

app.listen(8888);

app.get('/run',function(req,res){
  vibrator.cmd = "run";
  parser = vibrator.pipe(new ByteLength({length:8}));
  vibrator.write(Buffer.from(vibrator1.MBs.run,'hex'));
});

app.get('/stop',function(req,res){
  vibrator.write(Buffer.from(vibrator1.MBs.stop,'hex'));
  res.send("sjtooping");
});

app.get('/setHz/:hz',function(req,res){
   let buf = vibrator1.MBs.setHz + parseInt(req.params.hz + '00',10).toString(16);
   buf = Buffer.from(buf,'hex');
   buf = Buffer.concat([buf,GetCRC(buf)]);
   vibrator.write(buf);
   res.send();
});

app.get('/zeroHz',function(req,res){
  vibrator.write(Buffer.from(vibrator1.MBs.zeroHz,'hex'));
});


app.get('/getHzPV',function(req,res){
 parser = vibrator.pipe(new ByteLength({length:7}));
  vibrator1.cmd = "PV";
  vibrator.write(Buffer.from(vibrator1.MBs.getHzPV,'hex'));
});

app.get('/getHzSV',function(req,res){
 parser = vibrator.pipe(new ByteLength({length:7}));
 vibrator1.cmd = "SV";
  vibrator.write(Buffer.from(vibrator1.MBs.getHzSV,'hex'));
});

let t1 = setInterval(()=>{http.get('http://localhost:8888/getHzSV')},1000);

/*
Web Socket
*/



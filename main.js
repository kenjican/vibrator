/*
version:0.1
purpose: Communicate with vibrator JPS PDAN-2022
auther: Kenji Chen
date: 2018-Feb-10
*/
let bodyParser = require('body-parser');
let express = require('express');
let app = express();
let serialP = require('serialport');
let fs = require('fs');
let vibrator1 = JSON.parse(fs.readFileSync('./PDAN.json','utf8');


//let b = new Buffer([0x01,0x05,0x00,0x05,0x00,0x00,0xDD,0xCB]);
//let a = new Buffer([0x01,0x05,0x00,0x05,0xFF,0x00,0x9C,0x3B]);
/*
web server

*/
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.get('/',function(req,res){
  res.sendFile('/home/kenji/vibrator/index.htm');
});

app.listen(8888);

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

let vibrator = new serialP('/dev/ttyUSB0',{
  baudRate:19200,
  dataBits:8,
  stopBits:2,
  parity:'none',
});

app.get('/run',function(req,res){
  vibrator.write(Buffer.from(vibrator1.run));
  res.send("runinng");
});

app.get('/stop',function(req,res){
  vibrator.write(Buffer.from(vibrator1.stop));
  res.send("sjtooping");
});

app.get('/setHz/:hz',function(req,res){
  vibrator.write();
  res.send();
});

app.get('/zeroHz'),function(req,res){
  vibrator.write(Buffer.from(vibrator1.zeroHz));
});

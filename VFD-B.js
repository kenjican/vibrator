'use strict'

const fs = require('fs');
const VFDB = JSON.parse(fs.readFileSync('./VFD-B.json'));
const bodyParser = require('body-parser');
const WebSocketServer = require('ws').Server;
const SP = require('serialport');
const Koa = require('koa');
const app = Koa();
const router = require('koa-router');

/*
Set up serial port
*/
let U1 = new SP('/dev/ttyUSB0',{
  baudRate:VFDB.baudRate,
  dataBits:VFDB.dataBits,
  stopBits:VFDB.stopBits,
  parity:VFDB.parity
}); 






/*
Web
*/



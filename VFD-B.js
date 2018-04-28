"use strict";
const fs = require('fs');
let VFDB = JSON.parse(fs.readFileSync('./client/VFD-B.json'));
const bodyParser = require('body-parser');
const WebSocketServer = require('ws').Server;
const SP = require('serialport');
const Readline = SP.parsers.Readline;
const express = require('express');
const app = express();
const http = require('http');

/*
functions for switch
*/

const insSql = function() {
  http.get('http://localhost:8889/insert/' + JSON.stringify(VFDB.sts), (res) => {});
};
const noinsSql = function() {};
let swtchSql = noinsSql;


let getPSS = function() {
  swtchs();
  setQ(VFDB.cmdASCII.getPSS);
};

let swtchs = noinsSql;

/*
Set up serial port
*/

let U1 = new SP('/dev/ttyUSB0', {
  baudRate: VFDB.con.baudRate,
  dataBits: VFDB.con.dataBits,
  stopBits: VFDB.con.stopBits,
  parity: VFDB.con.parity
});

let parser = U1.pipe(new Readline({
  delimiter: '\r\n'
}));

parser.on('data', function(data) {
  switch (data.length) {
    case 21:
      VFDB.sts.DT = new Date().toLocaleString();
      VFDB.sts.stts = data.slice(7, 11);
      VFDB.sts.PV = parseInt(data.slice(15, 19), 16) / 100;
      VFDB.sts.SV = parseInt(data.slice(11, 15), 16) / 100;
      sendsts();
      swtchSql();
      chkQ();
      break;
    default:
      chkQ();
      break;

  }
});


U1.on('error', (err) => console.log(err));

function setQ(cmd) {
  if (VFDB.cmdASCII.Mutex) {
    VFDB.cmdASCII.Mutex = false;
    U1.write(cmd);
  } else {
    VFDB.cmdASCII.Que.push(cmd);
    if (VFDB.cmdASCII.Que.length > 2) {
      VFDB.cmdASCII.Mutex = true;
      VFDB.cmdASCII.QUE = [];
    }
  }
}

function chkQ() {
  if (VFDB.cmdASCII.Que.length != 0) {
    U1.write(VFDB.cmdASCII.Que.shift());
    return;
  }
  VFDB.cmdASCII.Mutex = true;
}


/*
LRC calculation
*/

function LRCchk(cmd) {
  let a = cmd.match(/../g).map(x => parseInt(x, 16));
  let b = a.reduce((x, y) => x + y);
  let LRC = ((b - 1) ^ 0xFF).toString(16).toUpperCase();
  LRC = LRC.padStart(2, '0').slice(-2);
  return LRC;
}


/*
Steps logic and functions
*/

function runStps() {
  if (VFDB.stps.lvlPointer == VFDB.stps.mltLvl.length) {
    VFDB.stps.loopPointer += 1;
    if (VFDB.stps.loopPointer != VFDB.stps.loop) {
      VFDB.stps.lvlPointer = 0;
    } else {
      setQ(VFDB.cmdASCII.stop);
      setSV(0);
      clearTimeout(t2);
      let sql = 'update schedule set endTime=NULL order by id desc limit 1';
      http.get('http://localhost:8889/sql/' + sql , (res) => {});
      return;
    }
  }
  setSV(VFDB.stps.mltLvl[VFDB.stps.lvlPointer][0]);
  t2 = setTimeout(runStps, VFDB.stps.mltLvl[VFDB.stps.lvlPointer][1] * 60000);
  VFDB.stps.lvlPointer += 1;
}

/*
Logarithm logic and function
*/

function runLoga() {
  let SV = 10 ** (VFDB.lgrm.log10 / VFDB.lgrm.tm * VFDB.lgrm.lcount) + VFDB.lgrm.strt;
  setSV(SV);
  if ((VFDB.lgrm.lcount == VFDB.lgrm.tm) || (VFDB.lgrm.lcount == 0)) {
    VFDB.lgrm.loop -= 1;
    if (VFDB.lgrm.loop == 0) {
      swtchs = noinsSql;
      swtchSql = noinsSql;
      setQ(VFDB.cmdASCII.stop);
      setSV(0);
      return;
    }
    VFDB.lgrm.drc = VFDB.lgrm.drc - (VFDB.lgrm.drc * 2);
  }

  VFDB.lgrm.lcount += VFDB.lgrm.drc;
}

function setSV(sv) {
  let SV2hex = (parseInt(sv * 100)).toString(16).padStart(4, '0');
  let LRC = LRCchk((VFDB.cmdASCII.setSV).slice(1, ) + SV2hex);
  let sSV = (VFDB.cmdASCII.setSV + SV2hex + LRC).toUpperCase() + '\r\n';
  setQ(sSV);
}


function runLinear() {
  if (VFDB.linear.lcount == VFDB.linear.tm) {
    VFDB.linear.loop -= 1;
    VFDB.linear.Arith *= -1;
    if (VFDB.linear.loop == 0) {
      swtchSql = noinsSql;
      swtchs = noinsSql;
      setQ(VFDB.cmdASCII.stop);
      setSV(0);
      return;
    }
    VFDB.linear.lcount = 0;
    if (VFDB.linear.loop % 2 != 0) {
      VFDB.linear.rstrt = VFDB.linear.end;
    } else {
      VFDB.linear.rstrt = VFDB.linear.strt;
    }
  }
  setSV(VFDB.linear.Arith * VFDB.linear.lcount + VFDB.linear.rstrt);
  VFDB.linear.lcount += 1;
}

function run(){
  swtchSql = insSql;
  setQ(VFDB.cmdASCII.run);
  let sql = 'insert into schedule (expName) values ("test")';
  http.get('http://localhost:8889/sql/' + sql ,(res) => {});

}

function stop(){
  swtchSql = noinsSql;
  swtchs = noinsSql;
  setQ(VFDB.cmdASCII.stop);
  setSV(0);
  clearTimeout(t2);
  let sql = 'update schedule set endTime=NULL order by id desc limit 1';
  http.get('http://localhost:8889/sql/' + sql , (res) => {});


}

/*
Web
*/

app.use('/client', express.static('./client'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/', function(req, res) {
  res.sendFile('/home/kenji/vibrator/index.htm');
});

app.get('/run', function(req, res) {
  run();
  res.send('run sent');
  res.end;
});

app.get('/stop', function(req, res) {
  stop();
  res.send('stop sent');
  res.end;
});

app.get('/getPV', function(req, res) {
  setQ(VFDB.cmdASCII.getPV);
});

app.get('/setSV/:SV', function(req, res) {
  setSV(req.params.SV);
  res.send('ok');
  res.end;
});

app.get('/test/:cmd', function(req, res) {
  setQ(':' + req.params.cmd + '\r\n');
  res.send(req.params.cmd);
  res.end;
});

app.get('/stps', function(req, res) {
  VFDB.stps.lvlPointer = 0;
  run();
  runStps();
  res.send('step running');
  res.end;
});

app.get('/runLoga', function(req, res) {
  swtchs = runLoga;
  VFDB.lgrm.log10 = Math.log10(VFDB.lgrm.span);
  VFDB.lgrm.loop *= 2;
  run();
  res.send('ok');
  res.end;
});


app.get('/runLinear', (req, res) => {
  swtchs = runLinear;
  VFDB.linear.Arith = (VFDB.linear.end - VFDB.linear.strt) / VFDB.linear.tm;
  VFDB.linear.loop *= 2;
  VFDB.linear.rstrt = VFDB.linear.strt;
  run();
  res.send('ok');
  res.end;
});

app.post('/saveConf',(req,res)=>{
  let data = JSON.stringify(req.body);
  fs.writeFile('./client/VFD-B.json',data,'utf8',(cb)=>{
    VFDB = JSON.parse(fs.readFileSync('./client/VFD-B.json')); //reload the config of VFDB
  });
  res.send('ok');
  res.end;
});

app.listen(8888);


/*
Timer
*/

let t1 = setInterval(getPSS, 1000);

let t2; //t2 for steps setTimeout
/*
WebSocket
*/

let wss = new WebSocketServer({
  port: 8887
});

function sendsts() {
  wss.clients.forEach((conn) => {
    conn.send(JSON.stringify(VFDB.sts));
  });
}

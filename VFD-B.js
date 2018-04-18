"use strict";
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
functions for switch
*/

const insSql = function() {
  http.get('http://localhost:8889/insert/' + JSON.stringify(VFDB.sts), (res) => {});
};
const noinsSql = function() {};
let swtchSql = noinsSql;


let getPSS = function() {
  setQ(VFDB.cmdASCII.getPSS);
  swtchs();
};

/*
const swtchLoga = function() {
  setQ(VFDB.cmdASCII.getPSS);
  runLoga();
};

const swtchLinear = function() {
  setQ(VFDB.cmdASCII.getPSS);
  runLinear();
};
*/


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
Steps logic and function
*/

function runStps() {
  if (VFDB.stps.lvlPointer == VFDB.stps.mltLvl.length) {
    VFDB.stps.loopPointer += 1;
    if (VFDB.stps.loopPointer != VFDB.stps.loop) {
      VFDB.stps.lvlPointer = 0;
      console.log(VFDB.stps.loopPointer);
    } else {
      console.log('end');
      setQ(VFDB.cmdASCII.stop);
      setSV(0);
      clearTimeout(t2);
      return;
    }
  }
  setSV(VFDB.stps.mltLvl[VFDB.stps.lvlPointer][0]);
  t2 = setTimeout(runStps, VFDB.stps.mltLvl[VFDB.stps.lvlPointer][1] * 1000);
  VFDB.stps.lvlPointer += 1;
}

/*
Logarithm logic and function
*/

function runLoga() {
  let SV = 10 ** (VFDB.lgrm.log10 / VFDB.lgrm.tm * VFDB.lgrm.lcount) + VFDB.lgrm.strt;
  console.log(SV);
  setSV(SV);
  if ((VFDB.lgrm.lcount == VFDB.lgrm.tm) || (VFDB.lgrm.lcount == 0)) {
    console.log('get if');
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
  console.log(VFDB.lgrm.lcount);
}

function setSV(sv) {
  let SV2hex = (parseInt(sv * 100)).toString(16).padStart(4, '0');
  let LRC = LRCchk((VFDB.cmdASCII.setSV).slice(1, ) + SV2hex);
  let sSV = (VFDB.cmdASCII.setSV + SV2hex + LRC).toUpperCase() + '\r\n';
  console.log(sSV);
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
  swtchSql = insSql;
  setQ(VFDB.cmdASCII.run);
  res.send('run sent');
  res.end;
});

app.get('/stop', function(req, res) {
  swtchSql = noinsSql;
  swtchs = noinsSql;
  setQ(VFDB.cmdASCII.stop);
  setSV(0);
  clearTimeout(t2);
  res.send('stop sent');
  res.end;
});

app.get('/getPV', function(req, res) {
  setQ(VFDB.cmdASCII.getPV);
});

app.get('/getPSS', function(req, res) {
  setQ(VFDB.cmdASCII.getPSS);
  res.send("ok");
  res.end;
});

app.get('/setSV/:SV', function(req, res) {
  setSV(req.params.SV);
  res.send('ok');
  res.end;
});

app.get('/test/:cmd', function(req, res) {
  console.log(req.params.cmd);
  setQ(':' + req.params.cmd + '\r\n');
  res.send(req.params.cmd);
  res.end;
});

app.get('/stps', function(req, res) {
  VFDB.stps.lvlPointer = 0;
  swtchSql = insSql;
  setTimeout(() => setQ(VFDB.cmdASCII.run), 300);
  runStps();
  res.send('step running');
  res.end;
});

app.get('/runLoga', function(req, res) {
  swtchSql = insSql;
  swtchs = runLoga;
  VFDB.lgrm.log10 = Math.log10(VFDB.lgrm.span);
  VFDB.lgrm.loop *= 2;
  res.send('ok');
  setQ(VFDB.cmdASCII.run);
  res.end;
});


app.get('/runLinear', (req, res) => {
  swtchSql = insSql;
  swtchs = runLinear;
  VFDB.linear.Arith = (VFDB.linear.end - VFDB.linear.strt) / VFDB.linear.tm;
  VFDB.linear.loop *= 2;
  res.send('ok');
  VFDB.linear.rstrt = VFDB.linear.strt;
  setQ(VFDB.cmdASCII.run);
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

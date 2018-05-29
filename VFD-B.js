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
let vfdbStatus = {};
/*
functions for switch
*/

const noinsSql = function () { };
let swtchSql = noinsSql;
let swtchs = noinsSql;

const insSql = function () {
  http.get('http://localhost:8889/insert/' + JSON.stringify(VFDB.sts), (res) => { }).on('error', (e) => {
    console.error(`error: ${e.message}`);
  });
}

let getPSS = function () {
  swtchs();
  setQ(VFDB.cmdASCII.getPSS);
};


/*
Set up serial port for VFDB
*/

let U1 = new SP('/dev/VFDB', {
  baudRate: VFDB.con.baudRate,
  dataBits: VFDB.con.dataBits,
  stopBits: VFDB.con.stopBits,
  parity: VFDB.con.parity
});

U1.on('error', (err) => {
  console.log(err + 'VFDB not connected');
});

let parser = U1.pipe(new Readline({
  delimiter: '\r\n'
}));

parser.on('data', function (data) {
  switch (data.length) {
    case 21:
      VFDB.sts.DT = new Date().toLocaleString();
      VFDB.sts.stts = data.slice(7, 11);
      VFDB.sts.PV = parseInt(data.slice(15, 19), 16) / 100;
      VFDB.sts.SV = parseInt(data.slice(11, 15), 16) / 100;
      sendsts();
      swtchSql();
      //chkQ();
      break;
    default:
      //chkQ();
      break;
  }
  chkQ();
});


/*
setup serial port for PC
*/


let U2 = new SP('/dev/PC', {
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: 'none'
});

let parser2 = U2.pipe(new Readline({
  delimiter: '\n'
}));

parser2.on('data', function (data) {
  switch (data.slice(0, 2)) {
    case '63':
      setSV(data.slice(2, 5));
      U2.write('635\r\n');
      break;
    case '62':
      setSV(data.slice(2, 5));
      U2.write('624\r\n');
      break;
    case '61':
      run();
      U2.write('617\r\n');
      break;
    case '64':
      stop();
      U2.write('642\r\n');
      break;
    default:
      break;
  }
});


U2.on('error', (err) => console.log(err + 'PC port not opened'));

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
1:loStp[loops,steps]

*/

function runStps() {
  if (VFDB.stps.lvlPointer == VFDB.stps.mltLvl.length) {
    VFDB.stps.loopPointer += 1;
    //VFDB.sts.loStp[0] = VFDB.stps.loopPointer;
    if (VFDB.stps.loopPointer != VFDB.stps.loop) {
      VFDB.stps.lvlPointer = 0;
    } else {
      clearTimeout(t2);
      stop();
      //setSV(0);
      return;
    }
    VFDB.sts.loStp[0] = VFDB.stps.loopPointer;
  }
  setSV(VFDB.stps.mltLvl[VFDB.stps.lvlPointer][0]);
  t2 = setTimeout(runStps, VFDB.stps.mltLvl[VFDB.stps.lvlPointer][1] * 60000);
  VFDB.stps.lvlPointer += 1;
  VFDB.sts.loStp[1] = VFDB.stps.lvlPointer;
}

/*
Logarithm logic and function. Timer set 100ms , VFDB would stop update SV ,other operation still working.
*/

function runLoga() {
  let SV = (10 ** (VFDB.lgrm.log10 / VFDB.lgrm.tm * VFDB.lgrm.lcount)) * VFDB.lgrm.k + VFDB.lgrm.strt;
  setSV(SV);
  VFDB.lgrm.lcount += VFDB.lgrm.drc;
  if ((VFDB.lgrm.lcount == VFDB.lgrm.tm) || (VFDB.lgrm.lcount == 0)) {
    VFDB.lgrm.loop -= 1;
    VFDB.sts.loStp = [VFDB.lgrm.loop];
    if (VFDB.lgrm.loop == 0) {
      //swtchs = noinsSql;
      //swtchSql = noinsSql;
      setSV(VFDB.lgrm.end);
      stop();
      //setSV(0);
      return;
    }
    VFDB.lgrm.drc = VFDB.lgrm.drc - (VFDB.lgrm.drc * 2);
  }
}

/*
Linear logic and function
*/

function runLinear() {
  if (VFDB.linear.lcount == VFDB.linear.tm) {
    VFDB.linear.loop -= 1;
    VFDB.sts.loStp = [VFDB.linear.loop];
    VFDB.linear.Arith *= -1;
    if (VFDB.linear.loop == 0) {
      //swtchSql = noinsSql;
      //swtchs = noinsSql;
      stop();
      //setSV(0);
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
functions in common
*/

function setSV(sv) {
  let SV2hex = (parseInt(sv * 100)).toString(16).padStart(4, '0');
  let LRC = LRCchk((VFDB.cmdASCII.setSV).slice(1, ) + SV2hex);
  let sSV = (VFDB.cmdASCII.setSV + SV2hex + LRC).toUpperCase() + '\r\n';
  setQ(sSV);
}

/*
1:switch to sql insert record
2:run
3:insert expeirment information to table schedule
*/
function run() {
  //if (VFDB.sts.SV.length < 10) {//make sure communcation with VFDB is ok,then run and add record in schedule table
    swtchSql = insSql;
    setQ(VFDB.cmdASCII.run);
    let sql = 'insert into schedule (expName,prdName,prdSn,runMode,strtHz,endHz,lpCount,lpTime) values (';
    sql += `'${VFDB.expInfo.expName}','${VFDB.expInfo.prdName}','${VFDB.expInfo.prdSn}',`;
    sql += `'${vfdbStatus.runMode}','${vfdbStatus.strtHz}','${vfdbStatus.endHz}','${vfdbStatus.loops}','${vfdbStatus.Ttm}')`;
    sql = encodeURIComponent(sql);
    http.get('http://localhost:8889/sql/' + sql, (res) => { }).on('error', (e) => {
      console.error(e);
      //return;
    });
}

/*
1:set sql and function to noinsSql (an empty function)
2:stop 
3:set sv to 0
4:update the end time in table schedule
*/
function stop() {
  swtchSql = noinsSql;
  swtchs = noinsSql;
  setQ(VFDB.cmdASCII.stop);
  setSV(0);
  clearTimeout(t2);
  let sql = 'update schedule set endTime=NULL order by id desc limit 1';
  http.get('http://localhost:8889/sql/' + sql, (res) => { }).on('error', (e) => {
    console.error(e);
  });
}
/*
1:check Mutual Exclusive,if true then send command to U1;else queue the command
2:if queued command more than three then clear queue and set 变频器未开机或通讯未连接给SV
3: send status to Chrome
*/
function setQ(cmd) {
  if (VFDB.cmdASCII.Mutex) {
    VFDB.cmdASCII.Mutex = false;
    U1.write(cmd);
  } else {
    VFDB.cmdASCII.Que.push(cmd);
    if (VFDB.cmdASCII.Que.length > 2) {
      VFDB.cmdASCII.Mutex = true;
      VFDB.cmdASCII.Que = [];
      VFDB.sts.SV = '变频器通讯异常';
      sendsts();
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

function rldConf() {
  VFDB = JSON.parse(fs.readFileSync('./client/VFD-B.json')); //reload the config of VFDB
}


/*
Web
*/

app.use('/client', express.static('./client'));
//app.use(bodyParser);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/', function (req, res) {
  res.sendFile('/home/kenji/vibrator/index.htm');
});
/*
app.get('/run', function (req, res) {
  run();
  res.send('run sent');
  res.end;
});
*/
app.get('/stop', function (req, res) {
  stop();
  res.send('stop sent');
  res.end;
});

app.get('/getPV', function (req, res) {
  setQ(VFDB.cmdASCII.getPV);
});

app.get('/setSV/:SV', function (req, res) {
  setSV(req.params.SV);
  res.send('ok');
  res.end;
});

app.get('/test/:cmd', function (req, res) {
  setQ(':' + req.params.cmd + '\r\n');
  res.send(req.params.cmd);
  res.end;
});

app.get('/runFix', (req, res) => {
  let a = new Date();
  vfdbStatus.strtTime = a.toLocaleString();
  vfdbStatus.endTime = "";
  vfdbStatus.Ttm = "";
  vfdbStatus.runMode = "定频";
  vfdbStatus
  run();
  res.end(JSON.stringify(vfdbStatus));
})

app.get('/runStps', function (req, res) {
  rldConf();
  let a = new Date();
  let b = new Date();
  let Ttm = VFDB.stps.tm * VFDB.stps.loop;
  b.setMinutes(a.getMinutes() + Ttm);
  vfdbStatus.strtTime = a.toLocaleString();
  vfdbStatus.endTime = b.toLocaleString();
  vfdbStatus.Ttm = Ttm;
  vfdbStatus.runMode = "多阶";
  vfdbStatus.strtHz = VFDB.stps.mltLvl[0][0];
  vfdbStatus.endHz = VFDB.stps.mltLvl[VFDB.stps.mltLvl.length - 1][0];
  vfdbStatus.loops = VFDB.stps.loop;
  vfdbStatus.lvls = VFDB.stps.mltLvl.length;

  VFDB.stps.lvlPointer = 0;
  VFDB.sts.loStp = [0, 0];
  //setSV(0);
  run();
  runStps();
  res.end(JSON.stringify(vfdbStatus));
});

app.get('/runLoga', function (req, res) {
  rldConf();
  let a = new Date();
  let b = new Date();
  let Ttm = VFDB.lgrm.tm * VFDB.lgrm.loop;
  b.setMinutes(a.getMinutes() + Ttm);
  vfdbStatus.strtTime = a.toLocaleString();
  vfdbStatus.endTime = b.toLocaleString();
  vfdbStatus.Ttm = Ttm;
  vfdbStatus.runMode = "对数";
  vfdbStatus.strtHz = VFDB.lgrm.strt;
  vfdbStatus.endHz = VFDB.lgrm.end;
  vfdbStatus.loops = VFDB.lgrm.loop;

  if (VFDB.lgrm.strt > VFDB.lgrm.end) {
    VFDB.lgrm.k = -1;
    VFDB.lgrm.strt += 1;
  } else {
    VFDB.lgrm.k = 1;
    VFDB.lgrm.strt -= 1;
  }
  VFDB.lgrm.log10 = Math.log10(VFDB.lgrm.span + 1);
  VFDB.lgrm.tm = VFDB.lgrm.tm * 60 / 2;
  VFDB.lgrm.loop *= 2;
  VFDB.sts.loStp = [VFDB.lgrm.loop];
  swtchs = runLoga;
  run();

  res.end(JSON.stringify(vfdbStatus));
});


app.get('/runLinear', (req, res) => {
  rldConf();
  let a = new Date();
  let b = new Date();
  let Ttm = VFDB.linear.tm * VFDB.linear.loop;
  b.setMinutes(a.getMinutes() + Ttm);
  vfdbStatus.strtTime = a.toLocaleString();
  vfdbStatus.endTime = b.toLocaleString();
  vfdbStatus.Ttm = Ttm;
  vfdbStatus.runMode = "线性";
  vfdbStatus.strtHz = VFDB.linear.strt;
  vfdbStatus.endHz = VFDB.linear.end;
  vfdbStatus.loops = VFDB.linear.loop;

  VFDB.linear.tm = VFDB.linear.tm * 60 / 2;
  VFDB.linear.Arith = (VFDB.linear.end - VFDB.linear.strt) / VFDB.linear.tm;
  VFDB.linear.loop *= 2;
  VFDB.linear.rstrt = VFDB.linear.strt;
  VFDB.sts.loStp = [VFDB.linear.loop]
  swtchs = runLinear;
  run();
  res.end(JSON.stringify(vfdbStatus));
});

app.post('/saveConf', (req, res) => {
  let data = JSON.stringify(req.body);
  console.log(req.body);
  //console.log(data);

  fs.writeFile('./client/VFD-B.json', data, 'utf8', (err) => {
    if (!err) {
      res.end('更新成功');
    } else {
      res.end('更新失败，请再更新一次或联系供应商');
    }
    //VFDB = JSON.parse(fs.readFileSync('./client/VFD-B.json')); //reload the config of VFDB
    rldConf();
  });
});

app.get('/getStts', (req, res) => {
  res.end(JSON.stringify(vfdbStatus));
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
/*
wss.on('error',()=>{
  wss = new WebSocketServer({
    port: 8887
  });
  console.log('websocket error');
});
*/

wss.on('error', function error(err) {
  console.log('we error');
});

function sendsts() {
  wss.clients.forEach((conn) => {
    try {
      conn.send(JSON.stringify(VFDB.sts));
    }
    catch (e) {
      console.log(e);
    }
  });
}


/*
process.on('uncaughtException', function (err) {
  console.log(err);
});

,function ack(err){
      console.log(err);
    });
*/
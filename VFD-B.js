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
functions for switch
*/

const insSql = function() {
  http.get('http://localhost:8889/insert/' + JSON.stringify(VFDB.sts), (res) => {});
};
const noinsSql = function() {};
let swtchSql = noinsSql;

const getPSS = function() {
  setQ(VFDB.cmdASCII.getPSS);
  swtchLoga();
  //setTimeout(()=>setQ(VFDB.cmdASCII.getPSS),300);
};
/*
const pssLoga = function(){
                 setQ(VFDB.cmdASCII.getPSS);
                 console.log("pss Loga get called");
                 //http.get('http://localhost:8888/getPSS',(res)=>{});
                 runLoga();
               };
*/
let swtchLoga = noinsSql;
//let swtchLoga = pssLoga;




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
      //   case :
      //     console.log(data);
      //    break;

    default:
      //console.log(data);
      chkQ();
      break;

  }
});


U1.on('error', (err) => console.log(err));

function setQ(cmd) {
  if (VFDB.cmdASCII.Mutex){
    VFDB.cmdASCII.Mutex = false;
    U1.write(cmd);
  } else {
    VFDB.cmdASCII.Que.push(cmd);
    if (VFDB.cmdASCII.Que.length > 2){
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
//let Stps = VFDB.stps.mltLvl;
//let loopStps = VFDB.stps.loop;

function runStps() {
  if (VFDB.stps.lvlPointer == VFDB.stps.mltLvl.length) {
    VFDB.stps.loopPointer += 1;
    if (VFDB.stps.loopPointer != VFDB.stps.loop) {
      VFDB.stps.lvlPointer = 0;
      console.log(VFDB.stps.loopPointer);
    } else {
      console.log('end');
      setQ(VFDB.cmdASCII.stop);
      setTimeout(() => setQ(VFDB.cmdASCII.setZero, 5000));
      return;
    }
  }
  setSV(VFDB.stps.mltLvl[VFDB.stps.lvlPointer][0]);
  setTimeout(runStps, VFDB.stps.mltLvl[VFDB.stps.lvlPointer][1] * 1000);
  VFDB.stps.lvlPointer += 1;
}

/*
Logarithm logic and function
*/
VFDB.lgrm.log10 = Math.log10(VFDB.lgrm.span);
VFDB.lgrm.loop *= 2;

function runLoga() {
  //setQ(VFDB.cmdASCII.getPSS);
  let SV = 10 ** (VFDB.lgrm.log10 / VFDB.lgrm.tm * VFDB.lgrm.lcount) + VFDB.lgrm.strt;
  console.log(SV);
  setSV(SV);
  //SV2hex = parseInt(SV2hex * 100).toString(16).padStart(4,'0').toUpperCase();
  //let LRC = LRCchk((VFDB.cmdASCII.setSV).slice(1,) + SV2hex);
  //let sSV = VFDB.cmdASCII.setSV + SV2hex + LRC + '\r\n';
  //sSV = sSV.toUpperCase();
  //console.log(sSV);
  //setQ(sSV);
  //http.get('http://localhost:8888/setSV/' + SV2hex.toFixed(2),(res)=>{});
  if ((VFDB.lgrm.lcount == VFDB.lgrm.tm) || (VFDB.lgrm.lcount == 0)) {
    console.log('get if');
    VFDB.lgrm.loop -= 1;
    if (VFDB.lgrm.loop == 0) {
      swtchLoga = noinsSql;
      swtchSql = noinsSql;
      setQ(VFDB.cmdASCII.stop);
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
  //sSV = sSV.toUpperCase();
  console.log(sSV);
  setQ(sSV);
}

/*
Web
*/

app.use('/client', express.static('./client'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
/*
app.use((req,res,next)=>{
  res.header("Access-Control-Allow-Origin","*");
  res.header("Access-Control-Allow-Headers","Origin,X-Request-With,Content-Type,Accept");
  next();
});

*/
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
  swtchLoga = noinsSql;
  setQ(VFDB.cmdASCII.stop);
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
  /*
    let SV2hex = (parseFloat(req.params.SV)*100).toString(16).padStart(4,'0');
    let LRC = LRCchk((VFDB.cmdASCII.setSV).slice(1,) + SV2hex);
    let sSV = VFDB.cmdASCII.setSV + SV2hex + LRC + '\r\n';
    sSV = sSV.toUpperCase();
    //console.log(sSV);
    setQ(sSV);
  */
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
  //setQ(VFDB.cmdASCII.setZero);
  VFDB.stps.lvlPointer = 0;
  swtchSql = insSql;
  //U1.drain(()=>setQ(VFDB.cmdASCII.run));
  setTimeout(() => setQ(VFDB.cmdASCII.run), 300);
  runStps();
  //  setQ(VFDB.cmdASCII.run);

  res.send('step running');
  res.end;
});

app.get('/runLoga', function(req, res) {
  swtchSql = insSql;
  swtchLoga = runLoga;
  res.send('ok');
  setTimeout(() => setQ(VFDB.cmdASCII.run), 500);
  res.end;
});




function getLocalPSS() {
  http.get('http://localhost:8888/getPSS', (res) => {
    //console.log(res);
  });
}




app.listen(8888);


/*
Timer
*/


let t1 = setInterval(getPSS, 1000);
//let t1 = setInterval(swtchLoga,1000);
//let t1 = setInterval(()=>pssLoga,1000);

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

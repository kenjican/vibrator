const express = require('express');
const app = express();
const fs = require('fs');
const mysql = require('mysql');
const DB = JSON.parse(fs.readFileSync('./mysql.json'));
DB.con.table = new Date().toLocaleString('en-us',{month:'short'});//
/*
Mysql
*/

let con = mysql.createConnection({
  host: DB.con.host,
  user: DB.con.user,
  password: DB.con.password,
  database: DB.con.database,
  dataStrings: true,
  insecureAuth: true
});


con.connect((err) => {
  if (err) {
    console.log(err.message);
    return;
  }
});


/*
Web
*/
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin,X-Request-With,Content-Type,Accept");
  next();
});

app.get('/insert/:sts', (req, res) => {
  res.end('ok');
  let d = JSON.parse(req.params.sts);
  let sql = `insert into ${DB.con.table} (PV, SV, Sts) values (${d.PV},${d.SV},${parseInt(d.stts)})`;
  con.query(sql, (err) => {
    if (err) throw err;
  });

});

app.get('/getHis/:fDate/:tDate', (req, res) => {
  let sql = `select DateTime,PV,SV from May where DateTime between '${req.params.fDate}' and '${req.params.tDate})'`;// and (id mod 5 = 0)`;
  con.query(sql, (err, result, fields) => {
    if (err) throw err;
    res.send(result);
  });
  res.end;

});

app.get('/getRT', (req, res) => {
  let firId = 0;
  let lstId = 0;
  let span = 0;
  let sql = 'select strtTime from schedule order by id desc limit 1';
  con.query(sql, (err, result) => {
    let table = result[0].strtTime.toLocaleString('en-us',{month:'short'});
    sql = `select id from ${table} where DateTime >= '${result[0].strtTime.toLocaleString()}' limit 1`;
    con.query(sql,(err,result)=>{
      firId = result[0].id - 1;
      sql = `select id from ${table} order by id desc limit 1`;
      con.query(sql, (err, result) => {
        lstId = result[0].id;
        span = parseInt((lstId - firId)/1000) + 1;
        sql = `select DateTime,PV,SV from ${table} where id >= ${firId} and (id mod ${span} = 0)`;
          con.query(sql,(err,result)=>{
            if(err) console.log(err);
            res.send(result);
            res.end;
          });
      });
    });
  });
});


app.get('/sql/:cmd', (req, res) => {
  //console.log(req.params.cmd);
  con.query(req.params.cmd, (err, result) => {
    if (err) throw err;
  });
  res.send('ok');
});

app.get('/', (req, res) => {
  res.send('OF');
  res.end;
});
app.listen(8889);

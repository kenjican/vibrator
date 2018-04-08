const express =  require('express');
const app = express ();
const fs = require('fs');
const mysql = require('mysql');
const DB = JSON.parse(fs.readFileSync('./mysql.json'));

/*
Mysql
*/

let con = mysql.createConnection({
  host:DB.con.host,
  user:DB.con.user,
  password:DB.con.password,
  database:DB.con.database
});

con.connect((err)=>{
  if(err){
     console.log(err.message);
     return;
  }
  //console.log('connectoin ok');
});


/*
Web
*/

app.get('/insert/:sts',(req,res)=>{
  let d = JSON.parse(req.params.sts);
  let sql = `insert into Apr04 (PV, SV, Sts) values (${d.PV},${d.SV},${d.stts})`;
  con.query(sql); 
  //console.log(sql);
  res.send('ok');
  res.end();
});

app.listen(8889);

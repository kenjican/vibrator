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
app.use((req,res,next)=>{
  res.header("Access-Control-Allow-Origin","*");
  res.header("Access-Control-Allow-Headers","Origin,X-Request-With,Content-Type,Accept");
  next();
});

app.get('/insert/:sts',(req,res)=>{
  let d = JSON.parse(req.params.sts);
  let sql = `insert into Apr04 (PV, SV, Sts) values (${d.PV},${d.SV},${parseInt(d.stts)})`;
  //console.log(sql);
  con.query(sql,(err,result)=>{
    if(err) throw err;
  }); 
  //console.log(sql);
  res.send('ok');
  //res.end();
});

app.get('/getHis/:fDate/:tDate',(req,res)=>{
  let sql = `select DateTime,PV,SV from Apr04 where DateTime between '${req.params.fDate}' and '${req.params.tDate}' and (id mod 5 = 0)`; 
  console.log(sql);
  con.query(sql,(err,result,fields)=>{
    if(err) throw err;
    //console.log(result);
    res.send(result);
   });
  res.end;

});

app.get('/',(req,res)=>{
  res.send('OF');
  res.end;
});
app.listen(8889);

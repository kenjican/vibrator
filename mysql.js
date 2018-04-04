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
  console.log('connectoin ok');
});


/*
Web
*/

app.get('/insert/:sts',(req,res)=>{
  console.log(res.params.sts);
  

});

router.get('/',async(ctx,next)=>{
  ctx.response.body = '<h1>index</h1>';
});

router.get('/gethis/:fdate/:tdate',async(ctx,next)=>{
  ctx.response.body = `from ${ctx.params.fdate} to ${ctx.params.tdate}`;
});

router.get('/checkDB/:dbName',async(ctx,next)=>{
  const year = new Date().getFullYear();
  con.query(DB.sql.checkDB + ctx.params.dbName,(error,result,field)=>{
    if(error){
      console.log(error.message);
      return;
    }
  });

router.get('/createDB'
  if(result.length == 0){
    con.query(DB.sql.createDB,(error,result,field)=>{
     });
  }
 });
});

app.listen(8889);

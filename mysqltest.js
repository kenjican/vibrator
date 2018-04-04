const mysql = require('mysql');

const con = mysql.createConnection({
  host:'localhost',
  user:'root',
  password:'chenjia1!',
  database:'THV'
});

con.connect((err)=>{
  if(err){
    console.log(err);
    return;
}
  console.log('connection OK');
});

const sql = 'create table May01 like template';
const sql2 = 'show tables like "Jan01"';
const sql3 = 'show databases like "%2018%"';
const sql4 = 'create database `2018` CHARACTER SET utf8 COLLATE utf8_general_ci';
const sql5 = 'create table Apr10 like THV.template';

con.query(sql5,(error,result,field)=>{
  if(error){
    console.log(error.message);
    return;
  }
  console.log(result);
  if(result.length == 0){
    con.query(sql4,(error,result,field)=>{
      if(error){
       console.log(error.message);
     }
      console.log(result);
  });
}
  return;
});

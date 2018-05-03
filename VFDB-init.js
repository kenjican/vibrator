const SP = require('serialport');
const Readline = SP.parsers.Readline;
let i = 0;
const U1 = new SP('/dev/VFDB', {
    baudRate: 9600,
    dataBits: 7,
    stopBits: 2,
    parity: 'none'
});

const parser = U1.pipe(new Readline({
    delimiter: '\r\n'
}));

parser.on('data', function (data) {
   i++;
   init();
   });

const cmd =[':0106020A0004E9\r\n',':010602010003F3\r\n',':010602000004F3\r\n',':010609010003EC\r\n'];

function init(){
  if(i<4){
  U1.write(cmd[i]);
  }
}

U1.on('error', (err) => console.log(err));

init();


let xmlhttp = new XMLHttpRequest();
let socket = new WebSocket('ws://192.168.0.20:8887');

socket.onmessage = function(msg){


}

function run(){
  xmlhttp.open("GET",'/run',true);
  xmlhttp.responseType = 'text';
  xmlhttp.send();
}

function stop(){
  xmlhttp.open("GET",'/stop',true);
  xmlhttp.responseType = 'text';
  xmlhttp.send();
}

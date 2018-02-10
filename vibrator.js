let xmlhttp = new XMLHttpRequest();

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

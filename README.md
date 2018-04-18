
1:The initial RS485 : 9600,7N2 ASCII
2:Reset VFD-B to factory setup : on panel,set 00-02 parameter to 09
3:RS485 config: 38400,8E1 RTU: on panel,set 09-01 to 03, 09-04 to 04
4:RS485 config change to 38400,7N2 ASCII.set 09-04 to 00
5:Serialport delimiter readline would remove the delimiter,,,such as \r\n,so the feedback length is two bytes less.
6: step ..how to set timer? generator? or a setTimeout loop?
  solution: setTimeout self loop.
7:Dynamic function,change the content of function on the fly...best solution is assign function to variable ,then assign different function to that variable.
8:set parameters dynamically...such as mysql socket,,to be localhost or remote server, put these dynamic parameters in json file and change on the fly.
9:convert query result to one array per column. It's for echarts rendering.Failed, can not find the query format.soution: let bowser to do that.
10:



/*
Interface Design
*/

Color Scheme:
1:background : black or dark gray
2:same or similar brightness ,saturation.High contrast with background
3:distict functions by color
4:feel light and vigorous

/*
structure
*/

1:Four functions: 1: fix , 2:steps ,3:Logarithm sweep, 4:Linear sweep
2:insert recored to Mysql when running, and stop while stopped. Use a variable to switch.
3:



error messages:
1:
at getPSS (/home/kenji/vibrator/VFD-B.js:22:18)
0|VFD-B    | Error: read ETIMEDOUT
0|VFD-B    |     at TCP.onread (net.js:602:25)
Suppose it's from express or mysql,might http module ...have to test more

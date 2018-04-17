
1:The initial RS485 : 9600,7N2 ASCII
2:Reset VFD-B to factory setup : on panel,set 00-02 parameter to 09
3:RS485 config: 38400,8E1 RTU: on panel,set 09-01 to 03, 09-04 to 04
4:RS485 config change to 38400,7N2 ASCII.set 09-04 to 00
5:Serialport delimiter readline would remove the delimiter,,,such as \r\n,so the feedback length is two bytes less.
6: step ..how to set timer? generator? or a setTimeout loop?
  solution: setTimeout self loop.
7:Dynamic function,change the content of function on the fly...best solution is assign function to variable ,then assign different function to that variable.
8:set parameters dynamically...such as mysql socket,,to be localhost or remote server, put these dynamic parameters in json file and change on the fly.
9:conver query result to one array per column. It's for echarts rendering.Failed, can not find the query format.




/*
Interface Design
*/

Color Scheme:
1:background : black or dark gray
2:same or similar brightness ,saturation.High contrast with background
3:distict functions by color
4:feel light and vigorous

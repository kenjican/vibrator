
1:The initial RS485 : 9600,7N2 ASCII
2:Reset VFD-B to factory setup : on panel,set 00-02 parameter to 09
3:RS485 config: 38400,8E1 RTU: on panel,set 09-01 to 03, 09-04 to 04
4:RS485 config change to 38400,7N2 ASCII.set 09-04 to 00
5:Serialport delimiter readline would remove the delimiter,,,such as \r\n,so the feedback length is two bytes less.
6: step ..how to set timer? generator? or a setTimeout loop?
  solution: setTimeout self loop.

// Include the static gule webserver library

var static = require('node-static');

var http = require('http');

//Assumer running on Herk

var port = process.env.PORT;
var directory = __dirname + '/public';

//If on local

if(typeof port == 'undefined' || !port){
  directory = '.public';
  port = 8080;
}

//set up static webserver to deliver from file sys
var file = new static.Server(directory);

// connect to network construct

var app = http.createServer(
  function(request,response){
    request.addListener('end',
      function(){
        file.serve(request,response);
      }
    ).resume();
  }
).listen(port);

console.log('All quiet on the western front');

// web socket server below

var io = require('socket.io').listen(app);

io.sockets.on('connection',function(socket){

  function log() {
    var array = ['*** Server Log Message:'];
    for (var i = 0; i <arguments.length; i++){
      array.push(arguments[i]);
      console.log(arguments[i])
    }
    socket.emit('log',array);
    socket.broadcast.emit('log',array);

  }

   log('an alien has connected to the server');

socket.on('disconnect',function(socket){
  log('an alien has connected from the server');
});
});

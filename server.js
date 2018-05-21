// Include the static gule webserver library

var static = require('node-static');

var http = require('http');

//Assumer running on Herk

var port = process.env.PORT;
var directory = __dirname + '/public';

//If on local

if(typeof port == 'undefined' || !port){
  directory = './public';
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
      console.log(arguments[i]);
    }
    socket.emit('log',array);
    socket.broadcast.emit('log',array);

  }

   log('An alien has connected to the server');

   socket.on('disconnect',function(socket){
     log('An alien has disconnected from the server');
   });

socket.on('join_room',function(payload){
  log('server received a command','join_room',payload);
  if(('undefined' === typeof payload) || !payload){
    var error_message = 'join_room had no payload; cmd aborted';
    socket.emit('join_room_response' , {
                                          result: 'fail',
                                          Message: error_message
                                        });
    return;
    }
    var room = payload.room;
    if(('undefined' === typeof room) || !room){
      var error_message = 'join_room did not specify a room; cmd aborted';
      socket.emit('join_room_response' , {
                                            result: 'fail',
                                            Message: error_message
                                          });
       return;
    }
    var room = payload.room;
    if(('undefined' === typeof room) || !room){
      var error_message = 'join_room did not specify a room; cmd aborted';
      socket.emit('join_room_response' , {
                                            result: 'fail',
                                            Message: error_message
                                          });
       return;
    }
    var username = payload.username;
    if(('undefined' === typeof username) || !username){
      var error_message = 'join_room did not specify a username; cmd aborted';
      socket.emit('join_room_response' , {
                                            result: 'fail',
                                            Message: error_message
                                          });
       return;
    }

    socket.join(room);
    var roomObject = io.sockets.adapter.rooms[room];
    if(('undefined' === typeof roomObject) || !roomObject){
      var error_message = 'join_room could not create a room (internal error); cmd aborted';
      socket.emit('join_room_response' , {
                                            result: 'fail',
                                            Message: error_message
                                          });
       return;
    }
    var numClients = roomObject.length;
    var success_data = {
                          result: 'success',
                          room: room,
                          username: username,
      										membership: (numClients + 1)
                        };
    io.sockets.in(room).emit('join_room_response',success_data);
    log('Room ' + room + ' was just joined by' + username + ' at ' +Date());

  });

  socket.on('send_message',function(payload){
    log('server received a command','send_message',payload);
    if(('undefined' === typeof payload) || !payload){
      var error_message = 'send_message had no payload; cmd aborted';
      socket.emit('send_message_response' , {
                                            result: 'fail',
                                            Message: error_message
                                          });
      return;
      }
      var room = payload.room;
      if(('undefined' === typeof room) || !room){
        var error_message = 'send_message did not specify a room; cmd aborted';
        socket.emit('send_message_response' , {
                                              result: 'fail',
                                              Message: error_message
                                            });
         return;
      }
      var username = payload.username;
      if(('undefined' === typeof username) || !username){
        var error_message = 'join_room did not specify a username; cmd aborted';
        socket.emit('send_message_response' , {
                                              result: 'fail',
                                              Message: error_message
                                            });
         return;
      }
      var message = payload.message;
      if(('undefined' === typeof message) || !message){
        var error_message = 'send_message did not specify a username; cmd aborted';
        socket.emit('send_message_response' , {
                                              result: 'fail',
                                              Message: error_message
                                            });
         return;
      }

      var success_data = {
                            result: 'success',
                            room: room,
                            username: username,
                            message: message

      };

      io.sockets.in(room).emit('send_message_response',success_data);
      log('Message sent to room ' + room + ' by  '+ username);

    });

   });

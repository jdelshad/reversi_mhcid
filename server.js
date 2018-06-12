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

var players = [];


var io = require('socket.io').listen(app);

io.sockets.on('connection',function(socket){

     log('An alien by the name '+socket.id+ 'has connected to the server');

  function log() {
    var array = ['*** Server Log Message:'];
    for (var i = 0; i <arguments.length; i++){
      array.push(arguments[i]);
      console.log(arguments[i]);
    }
    socket.emit('log',array);
    socket.broadcast.emit('log',array);

  }






socket.on('join_room',function(payload){

  log('\'join_room\' command'+ JSON.stringify(payload));

  //check client send payload

  if(('undefined' === typeof payload) || !payload){
    var error_message = 'join_room had no payload; cmd aborted';
    socket.emit('join_room_response' , {
                                          result: 'fail',
                                          Message: error_message
                                        });
    return;
    }
    //valid room check
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

    //store player info

    players[socket.id] = {};
    players[socket.id].username = username;
    players[socket.id].room = room;


    socket.join(room);

    //get roomObject
    var roomObject = io.sockets.adapter.rooms[room];

    //inform room of join
    var numClients = roomObject.length;
    var success_data = {
                          result: 'success',
                          room: room,
                          username: username,
                          socket_id: socket.id,
      										membership: numClients
                        };
    io.in(room).emit('join_room_response',success_data);

    for(var socket_in_room in roomObject.sockets){
      var success_data = {
                            result: 'success',
                            room: room,
                            username: players[socket_in_room].username,
                            socket_id: socket_in_room,
                            membership: numClients

      };
      socket.emit('join_room_response',success_data);

    }
    log('join_room success');

    if(room !== 'lobby'){
      send_game_update(socket,room,'initial update');
    }


  });
  socket.on('disconnect',function(){
    log('An alien has disconnected '+JSON.stringify(players[socket.id]));

    if('undefined' !== typeof players[socket.id] && players[socket.id]){
      var username = players[socket.id].username;
      var room = players[socket.id].room;
      var payload = {
                      username: username,
                      socket_id: socket.id
      };
      delete players[socket.id];
      io.in(room).emit('player_disconnected',payload);
    }
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
      var username = players[socket.id].username;
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
                            username: username,
                            message: message

      };

      io.in(room).emit('send_message_response',success_data);
      log('Message sent to room ' + room + ' by  '+ username);


    });


//invite command

    socket.on('invite',function(payload){
      log('invite with '+JSON.stringify(payload));

      //check payload
      if(('undefined' === typeof payload) || !payload){
        var error_message = 'invite had no payload; cmd aborted';
        log(error_message);
        socket.emit('invite_response' , {
                                              result: 'fail',
                                              Message: error_message
                                            });
        return;
        }
      // is legit user?
        var username = players[socket.id].username;
        if(('undefined' === typeof username) || !username){
          var error_message = 'invite can not ID username; cmd aborted';
          log(error_message);
          socket.emit('invite_response' , {
                                                result: 'fail',
                                                Message: error_message
                                              });
           return;
        }
        var requested_user = payload.requested_user;
        if(('undefined' === typeof requested_user) || !requested_user){
          var error_message = 'invite user not specify a username; cmd aborted';
          socket.emit('invite_response' , {
                                                result: 'fail',
                                                Message: error_message
                                              });
           return;
        }

        var room = players[socket.id].room;
        var roomObject = io.sockets.adapter.rooms[room];
        // make sure user is invited to rooms
        if(!roomObject.sockets.hasOwnProperty(requested_user)){
          var error_message = 'invite requested a user not in room; cmd aborted';
          log(error_message);
          socket.emit('invite_response' , {
                                                result: 'fail',
                                                Message: error_message
                                              });
           return;

        }

        var success_data = {
                              result: 'success',
                              socket_id: requested_user
        };

        socket.emit('invite_response',success_data);

        var success_data = {

                            result: 'success',
                            socket_id: socket.id
        };

        socket.to(requested_user).emit('invited',success_data);

        log('invite success');

        //uninvite command

            socket.on('uninvite',function(payload){
              log('uninvite with '+JSON.stringify(payload));

              //check payload
              if(('undefined' === typeof payload) || !payload){
                var error_message = 'uninvite had no payload; cmd aborted';
                log(error_message);
                socket.emit('uninvite_response' , {
                                                      result: 'fail',
                                                      Message: error_message
                                                    });
                return;
                }
              // is legit user?
                var username = players[socket.id].username;
                if(('undefined' === typeof username) || !username){
                  var error_message = 'uninvite can not ID username; cmd aborted';
                  log(error_message);
                  socket.emit('uninvite_response' , {
                                                        result: 'fail',
                                                        Message: error_message
                                                      });
                   return;
                }
                var requested_user = payload.requested_user;
                if(('undefined' === typeof requested_user) || !requested_user){
                  var error_message = 'uninvite user not specified a username; cmd aborted';
                  socket.emit('uninvite_response' , {
                                                        result: 'fail',
                                                        Message: error_message
                                                      });
                   return;
                }

                var room = players[socket.id].room;
                var roomObject = io.sockets.adapter.rooms[room];
                // make sure user is invited to rooms
                if(!roomObject.sockets.hasOwnProperty(requested_user)){
                  var error_message = 'invite requested a user not in room; cmd aborted';
                  log(error_message);
                  socket.emit('uninvite_response' , {
                                                        result: 'fail',
                                                        Message: error_message
                                                      });
                   return;

                }

                var success_data = {
                                      result: 'success',
                                      socket_id: requested_user
                };

                socket.emit('uninvite_response',success_data);

                var success_data = {

                                    result: 'success',
                                    socket_id: socket.id
                };

                socket.to(requested_user).emit('uninvited',success_data);

                log('uninvite success');


      });

      //play command

          socket.on('game_start',function(payload){
            log('game_start with '+JSON.stringify(payload));

            //check payload
            if(('undefined' === typeof payload) || !payload){
              var error_message = 'game_start had no payload; cmd aborted';
              log(error_message);
              socket.emit('game_start_response' , {
                                                    result: 'fail',
                                                    Message: error_message
                                                  });
              return;
              }
            // is legit user?
              var username = players[socket.id].username;
              if(('undefined' === typeof username) || !username){
                var error_message = 'game_start can not ID username; cmd aborted';
                log(error_message);
                socket.emit('game_start_response' , {
                                                      result: 'fail',
                                                      Message: error_message
                                                    });
                 return;
              }
              var requested_user = payload.requested_user;
              if(('undefined' === typeof requested_user) || !requested_user){
                var error_message = 'game_start user not specified a username; cmd aborted';
                socket.emit('game_start_response' , {
                                                      result: 'fail',
                                                      Message: error_message
                                                    });
                 return;
              }

              var room = players[socket.id].room;
              var roomObject = io.sockets.adapter.rooms[room];
              // make sure user is invited to rooms
              if(!roomObject.sockets.hasOwnProperty(requested_user)){
                var error_message = 'game_start requested a user not in room; cmd aborted';
                log(error_message);
                socket.emit('game_start_response' , {
                                                      result: 'fail',
                                                      Message: error_message
                                                    });
                 return;

              }

              var game_id = Math.floor((1+Math.random()) * 0x10000.toString(16).substring());
              var success_data = {
                                    result: 'success',
                                    socket_id: requested_user,
                                    game_id: game_id
              };

              socket.emit('game_start_response',success_data);

              var success_data = {

                                  result: 'success',
                                  socket_id: socket.id,
                                  game_id: game_id
              };

              socket.to(requested_user).emit('game_start_response',success_data);

              log('game_start_response success');


    });

    //play token command

        socket.on('play_token',function(payload){
          log('play_token with '+JSON.stringify(payload));

          //check payload
          if(('undefined' === typeof payload) || !payload){
            var error_message = 'play_token had no payload; cmd aborted';
            log(error_message);
            socket.emit('play_token_response', {
                                                  result: 'fail',
                                                  Message: error_message
                                                });
            return;
            }
          // is legit user?
            var player = players[socket.id];
            if(('undefined' === typeof player) || !player){
              var error_message = 'server does not recognize user try back';
              log(error_message);
              socket.emit('play_token_response' , {
                                                    result: 'fail',
                                                    Message: error_message
                                                  });
               return;
            }

            var username = players[socket.id].username;
            if(('undefined' === typeof username) || !username){
              var error_message = 'play_tocket can not ID username; cmd aborted';
              log(error_message);
              socket.emit('play_token_response' , {
                                                    result: 'fail',
                                                    Message: error_message
                                                  });
               return;
            }

            var game_id = players[socket.id].room;
            if('undefined' === typeof game_id){
              var error_message = 'play_tocket can find game; cmd aborted';
              log(error_message);
              socket.emit('play_token_response' , {
                                                    result: 'fail',
                                                    Message: error_message
                                                  });
               return;
            }

            var row = payload.row;
            if(('undefined' === typeof row) || row < 0 || row > 7){
              var error_message = 'play_tocket can find payload.row; cmd aborted';
              log(error_message);
              socket.emit('play_token_response' , {
                                                    result: 'fail',
                                                    Message: error_message
                                                  });
               return;
            }

            var column = payload.column;
            if(('undefined' === typeof column) || column < 0 || column > 7){
              var error_message = 'play_tocket can find payload.column; cmd aborted';
              log(error_message);
              socket.emit('play_token_response' , {
                                                    result: 'fail',
                                                    Message: error_message
                                                  });
               return;
            }

            var color = payload.color;
            if(('undefined' === typeof color) || (color != 'white' && color !='black')){
              var error_message = 'play_tocket can find color; cmd aborted';
              log(error_message);
              socket.emit('play_token_response' , {
                                                    result: 'fail',
                                                    Message: error_message
                                                  });
               return;
            }

            var game = games[game_id];
            if(('undefined' === typeof game ) || !game){
              var error_message = 'play_tocket can find game; cmd aborted';
              log(error_message);
              socket.emit('play_token_response' , {
                                                    result: 'fail',
                                                    Message: error_message
                                                  });
               return;
            }

            var success_data = {
              result: 'success'

            };

            socket.emit('play_token_response',success_data);

            //exe move

            if(color == 'white'){
              game.board[row][column] = 'w';
              game.whose_turn = 'black';
            }
            else if (color == 'black') {
              game.board[row][column] = 'b';
              game.whose_turn = 'white';
            }

            var d = new Date();
            game.last_move_time = d.getTime();

            send_game_update(socket,game_id, 'played a token');

   });
 });
});
// This is code for game_state

var games = [];

function create_new_game(){
  var new_game = {};
  new_game.player_white = {};
  new_game.player_black = {};

  new_game.player_white.socket = '';
  new_game.player_white.username = '';

  new_game.player_black.socket = '';
  new_game.player_black.username = '';

  var d = new Date();
  new_game.last_move_time = d.getTime();

  new_game.whose_turn = 'black';

  new_game.board = [
		[' ',' ',' ',' ',' ',' ',' ',' ',],
		[' ',' ',' ',' ',' ',' ',' ',' ',],
		[' ',' ',' ',' ',' ',' ',' ',' ',],
		[' ',' ',' ','w','b',' ',' ',' ',],
		[' ',' ',' ','b','w',' ',' ',' ',],
		[' ',' ',' ',' ',' ',' ',' ',' ',],
		[' ',' ',' ',' ',' ',' ',' ',' ',],
		[' ',' ',' ',' ',' ',' ',' ',' ',]
	];

  return new_game;

}


function send_game_update(socket, game_id, message){

  //check to see if game id exists
  if(('undefined'== typeof games[game_id]) || !games[game_id]){
    console.log('No such game exists. Creating '+game_id+' for '+socket.id);
    games[game_id] = create_new_game();
  }

  //make sure only 2 people in room

  var roomObject;
  var numClients;
  do{
    roomObject = io.sockets.adapter.rooms[game_id];
    numClients = roomObject.length;
    if(numClients > 2){
      console.log('too many clients in room: '+game_id+ ' #:  '+numClients);
      if(games[game_id].players_white.socket == roomObject.socket[0]){
        games[game_id].players_white.socket = '';
        games[game_id].players_white.username = '';

      }
      if(games[game_id].players_black.socket == roomObject.sockes[0]){
        games[game_id].players_black.socket = '';
        games[game_id].players_black.username = '';

      }
      //kick out function
      var sarcrifice = Object.keys(roomObject.sockets)[0];
      io.of('/').connected[sarcrifice].leave(game_id);
    }

  }
  while((numClients-1) >2);



  //assign this socket a color
  //if cur player does not have color
  if ((games[game_id].player_white.socket !== socket.id) && (games[game_id].player_black.socket !== socket.id)) {
		console.log('Player isn\'t assigned a color: '+ socket.id);
		// and there isn't a color to give them
		if ((games[game_id].player_black.socket !== '') && (games[game_id].player_white.socket !== '')) {
			games[game_id].player_white.socket = '';
			games[game_id].player_white.username = '';
			games[game_id].player_black.socket = '';
			games[game_id].player_black.username = '';
		}
	}
  //assign colors if not already Done

  if (games[game_id].player_white.socket === '') {
		if (games[game_id].player_black.socket !== socket.id) {
			games[game_id].player_white.socket = socket.id;
			games[game_id].player_white.username = players[socket.id].username;
		}
	}

	if (games[game_id].player_black.socket === '') {
		if (games[game_id].player_white.socket !== socket.id) {
			games[game_id].player_black.socket = socket.id;
			games[game_id].player_black.username = players[socket.id].username;
		}
	}
  //send send_game_update

  var success_data = {
                      result: 'success',
                  		game: games[game_id],
                  		message: message,
                  		game_id: game_id
                    };
  io.in(game_id).emit('game_update',success_data);


  //check to see if game is over

  var row,column;
  var count =0;
  for(row =0; row <8;row++){
    for(column =0; column <8;column++){
      if(games[game_id].board[row][column] !== ' '){
        count++;
      }
    }
  }
  if(count == 64){
    var success_data = {
      results:  'success',
      game: games[game_id],
      who_won: 'everrryonnee wins',
      game_id: game_id
    };
    io.in(game_id).emit('game_over', success_data);

    //delete oldgames
    setTimeout(function(id){
      return function(){
        delete games[id];
      }}(game_id)
      ,60*60*1000);
  }

}

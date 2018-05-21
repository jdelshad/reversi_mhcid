
function getURlParameter(urlParam){
  var pageURl = window.location.search.substring(1);
  var pageURlVariables = pageURl.split('&');
  for(var i = 0; i <pageURlVariables.length; i++){
    var paramaterName = pageURlVariables[i].split('=');
    if(paramaterName[0] == urlParam){
      return paramaterName[1];
    }
  }

}


var username = getURlParameter('username');
if('undefined' == typeof username || !username){
  username = 'Anonymous_'+Math.random();
}

var chat_room = 'One_Room';


/* CONNECT TO SOCKET.IO */

var socket = io.connect();

socket.on('log',function(array){
  console.log.apply(console,array);
});

socket.on('join_room_response', function(payload){
  if(payload.result == 'fail'){
    alert(payload.message);
    return;
  }
  $('#messages').append('<p> New user joined the room: '+payload.username+'</p>');
});

socket.on('send_message_response', function(payload){
  if(payload.result == 'fail'){
    alert(payload.message);
    return;
  }
  $('#messages').append('<p><b>'+payload.username+' says:</b>'  +payload.message +'</p>');
});



function send_message(){
  var payload = {};
  payload.room = chat_room;
  payload.username = username;
  payload.message = $('#send_message_holder').val();
  socket.emit('send_message',payload);
  console.log('*** Client Log Message: \'send_message\' payload: '+JSON.stringify(payload));
}



$(function(){
  var payload = {};
  payload.room = chat_room;
  payload.username = username;

  console.log('*** Client Log Message: \'join_room\' payload: '+JSON.stringify(payload));
  socket.emit('join_room', payload);
});

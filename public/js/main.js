

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

var chat_room = getURlParameter('game_id');
if('undefined' == typeof chat_room || !chat_room){
  chat_room = 'lobby';

}

/* CONNECT TO SOCKET.IO */

var socket = io.connect();

socket.on('log',function(array){
  console.log.apply(console,array);
});

//log message handler
socket.on('join_room_response', function(payload){
  if(payload.result == 'fail'){
    alert(payload.message);
    return;
  }
  // if we are joining room ignore
  if(payload.socket_id == socket.id){
  return;
  }


  //if someone joins add a new row to table

  var dom_element = $('.socket_'+payload.socket_id);
  if(dom_element.length === 0){
    var nodeA = $('<div></div>');
    nodeA.addClass('socket_'+payload.socket_id);

    var nodeB = $('<div></div>');
    nodeB.addClass('socket_'+payload.socket_id);

    var nodeC = $('<div></div>');
    nodeC.addClass('socket_'+payload.socket_id);

    nodeA.addClass('w-100');

    nodeB.addClass('col 9 text-right');
    nodeB.append('<h4>'+payload.username+'</h4>');


    nodeC.addClass('col-3 text-left');
    var buttonC = makeInviteButton(payload.socket_id);
    nodeC.append(buttonC);

    nodeA.hide();
    nodeB.hide();
    nodeC.hide();

    $('#players').append(nodeA,nodeB,nodeC);

    nodeA.slideDown(1000);
    nodeB.slideDown(1000);
    nodeC.slideDown(1000);
  }
  else {
    var buttonC = makeInviteButton(payload.socket_id);
    $('socket_'+payload.socket_id+' button').replaceWith(buttonC);
    dom_element.slideDown(1000);
  }

  socket.on('player_disconnected', function(payload){
    if(payload.result == 'fail'){
      alert(payload.message);
      return;
    }
    // if we are joining room ignore
    if(payload.socket_id == socket.id){
    return;
    }

    //if someone leaves delete a new row to table

    var dom_element = $('.socket_'+payload.socket_id);
    if(dom_element.length != 0){
      dom_element.slideUp(1000);

    }


  //message handler
  var newHTML = '<p>'+payload.username+' just left the atmosphere (lobby) </p>';
  var newNode = $(newHTML);
  newNode.hide();
  $('#messages').append(newNode);
  newNode.slideDown(1000);
  });
});

function invite(who){
  var payload = {};
  payload.requested_user = who;

  console.log('*** Client Log Message: invite payload: '+JSON.stringify(payload));
  socket.emit('invite',payload);
}

//invite response
socket.on('invite_response', function(payload){
  if(payload.result == 'fail'){
    alert(payload.message);
    return;
  }
  var newNode = makeInvitedButton();
  $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

//invited response
socket.on('invited', function(payload){
  if(payload.result == 'fail'){
    alert(payload.message);
    return;
  }
  var newNode = makePlayButton();
  $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});



// send message response
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

function makeInviteButton(socket_id){
  var newHTML = '<button type=\'button\' class=\'btn btn-outline-primary\'> Invite </button>';
  var newNode = $(newHTML);
  newNode.click(function() {
    invite(socket_id);

  });
  return(newNode);
}

function makeInvitedButton(){
  var newHTML = '<button type=\'button\' class=\'btn btn-primary\'> Invited </button>';
  var newNode = $(newHTML);
  return(newNode);
}

function makePlayButton(){
  var newHTML = '<button type=\'button\' class=\'btn btn-success\'> Invited </button>';
  var newNode = $(newHTML);
  return(newNode);
}

function makeEngagedButton(){
  var newHTML = '<button type=\'button\' class=\'btn btn-danger\'> Engage! </button>';
  var newNode = $(newHTML);
  return(newNode);
}

$(function(){
  var payload = {};
  payload.room = chat_room;
  payload.username = username;

  console.log('*** Client Log Message: \'join_room\' payload: '+JSON.stringify(payload));
  socket.emit('join_room', payload);
});

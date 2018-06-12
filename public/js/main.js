

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
  if(payload.socket_id === socket.id){
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
    uninvite(payload.socket_id);
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
    if(dom_element.length !== 0){
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
  var newNode = makeInvitedButton(payload.socket_id);
  $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

//invited response
socket.on('invited', function(payload){
  if(payload.result === 'fail'){
    alert(payload.message);
    return;
}
  var newNode = makePlayButton(payload.socket_id);
  $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

function uninvite(who){
  var payload = {};
  payload.requested_user = who;

  console.log('*** Client Log Message: uninvite payload: '+JSON.stringify(payload));
  socket.emit('uninvite',payload);
}

//uninvite response
socket.on('uninvite_response', function(payload){
  if(payload.result == 'fail'){
    alert(payload.message);
    return;
  }
  var newNode = makeInviteButton(payload.socket_id);
  $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

//uninvited response
socket.on('uninvited', function(payload){
  if(payload.result == 'fail'){
    alert(payload.message);
    return;
  }
  var newNode = makeInviteButton(payload.socket_id);
  $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

function game_start(who){
  var payload = {};
  payload.requested_user = who;

  console.log('*** Client Log Message: game start payload: '+JSON.stringify(payload));
  socket.emit('game_start',payload);
}

//play or games start response
socket.on('game_start_response', function(payload){
  if(payload.result === 'fail'){
    alert(payload.message);
    return;
  }
  var newNode = makeEngageButton(payload.socket_id);
  $('.socket_'+payload.socket_id+' button').replaceWith(newNode);

  //new page jump
  window.location.href = 'game.html?username='+username+'&game_id='+payload.game_id;
});






function send_message(){
  var payload = {};
  payload.room = chat_room;
  payload.username = username;
  payload.message = $('#send_message_holder').val();
  socket.emit('send_message',payload);
  console.log('*** Client Log Message: \'send_message\' payload: '+JSON.stringify(payload));
  $('#send_message_holder').val('');
}

// send message response
socket.on('send_message_response', function(payload){
  if(payload.result == 'fail'){
    alert(payload.message);
    return;
  }
  var newHTML = '<p><b>'+payload.username+' says: </b>'  +payload.message +'</p>';
  newNode = $(newHTML);
  newNode.hide();
  $('#messages').append(newNode);
  newNode.slideDown(1000);
});

function makeInviteButton(socket_id){
  var newHTML = '<button type=\'button\' class=\'btn btn-outline-primary\'> Invite </button>';
  var newNode = $(newHTML);
  newNode.click(function() {
    invite(socket_id);

  });

  return(newNode);
}

function makeInvitedButton(socket_id){
  var newHTML = '<button type=\'button\' class=\'btn btn-primary\'> Invited </button>';
  var newNode = $(newHTML);
  newNode.click(function() {
    uninvite(socket_id);

  });

  return(newNode);
}

function makePlayButton(socket_id){
  var newHTML = '<button type=\'button\' class=\'btn btn-success\'> Invited </button>';
  var newNode = $(newHTML);
  newNode.click(function() {
    game_start(socket_id);

  });
  return(newNode);
}

function makeEngageButton(){
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

  $('#quit').append('<a href="lobby.html?username='+username+'" class="btn btn-danger btn-default btn-active" role="button" aria-pressed=<"true">Quit</a>');

});

//handle games start from server

var old_board= [
        ['?','?','?','?','?','?','?','?',],
      	['?','?','?','?','?','?','?','?',],
      	['?','?','?','?','?','?','?','?',],
      	['?','?','?','?','?','?','?','?',],
      	['?','?','?','?','?','?','?','?',],
      	['?','?','?','?','?','?','?','?',],
      	['?','?','?','?','?','?','?','?',],
      	['?','?','?','?','?','?','?','?',]

];

var my_color = ' ';

socket.on('game_update', function(payload){
  console.log('*** Client Log Message: \'game_update\' \n\tpayload: '+JSON.stringify(payload));
  if(payload.result == 'fail'){
    console.log(payload.message);
    window.location.href = 'lobby.html?username='+username;
    return;
  }

  //check for good payload
  var board = payload.game.board;
  if('undefined' == typeof board || !board){
    console.log('internal error bad board update from server, death to all!')
    return;
  }

  //update color
  //update my color

  if(socket.id === payload.game.player_white.socket){
    my_color = 'white';
  }
  else if(socket.id === payload.game.player_black.socket){
    my_color = 'black';
  }
  else{
    //something weird
    window.location.href = 'lobby.html?username='+username;
    return;
  }

  $('#my_color').html('<h3 id="my_color">I am '+my_color+'</h3>');

  var blacksum = 0;
  var whitesum = 0;

  var row,column;
  for(row=0; row < 8; row++){
    for(column=0; column < 8; column++){
      if (board[row][column] == 'b'){
        blacksum++;
      }
      if (board[row][column] == 'w'){
        whitesum++;
      }
    //if board changed
    if (old_board[row][column] !== board[row][column]){
      console.log('*** Board Space Has Changed : '+JSON.stringify(old_board[row][column]+'!=='+board[row][column]));

      if (old_board[row][column] === '?' && board[row][column] === ' ') {
        $('#'+row+'_'+column).html('<img src="assets/images/empty.gif" alt="empty square"/>');
      }
      else if (old_board[row][column] === '?' && board[row][column] === 'w') {
        $('#'+row+'_'+column).html('<img src="assets/images/White.gif" alt="white square">');
      }
      else if (old_board[row][column] === '?' && board[row][column] === 'b'){
        $('#'+row+'_'+column).html('<img src="assets/images/black.gif" alt="black square">');
      }
      else if (old_board[row][column] === ' ' && board[row][column] === 'w') {
        $('#'+row+'_'+column).html('<img src="assets/images/White.gif" alt="empty square">');
      }
      else if (old_board[row][column] === ' ' && board[row][column] === 'b'){
        $('#'+row+'_'+column).html('<img src="assets/images/black.gif" alt="empty square">');
      }
      else if (old_board[row][column] === 'w' && board[row][column] === ' ') {
        $('#'+row+'_'+column).html('<img src="assets/images/whitetoblack.gif" alt="black square">');
      }
      else if (old_board[row][column] === 'b' && board[row][column] === ' '){
        $('#'+row+'_'+column).html('<img src="assets/images/blacktowhite.gif" alt="white square">');
      }
      else if (old_board[row][column] === 'w' && board[row][column] === 'b') {
        $('#'+row+'_'+column).html('<img src="assets/images/whitetoblack.gif" alt="black square">');
      }
      else if (old_board[row][column] === 'b' && board[row][column] === 'w'){
        $('#'+row+'_'+column).html('<img src="assets/images/blacktowhite.gif" alt="white square">');
      }
      else {
        $('#'+row+'_'+column).html('<img src="assets/images/error.gif" alt="error"/>');
      }

      //set up interaction

      $('#'+row+'_'+column).off('click');
      if(board[row][column] == ' '){
        $('#'+row+'_'+column).addClass('hovered_over');
        $('#'+row+'_'+column).click(function(r,c){
          return function(){
            var payload = {};
            payload.row = r;
            payload.column = c;
            payload.color = my_color;
            console.log('*** Client Log Message: \'play_token payload:  '+ JSON.stringify(payload));
            socket.emit('play_token',payload);
          };
        }(row,column));
      }
      else{
          $('#'+row+'_'+column).removeClass('hovered_over');
      }

    }



  }


  //animate changes

};

  //check for good games game_update
  $('#blacksum').html(blacksum);
  $('#white').html(whitesum);
  old_board = board;
});

socket.on('play_token_response', function(payload){
  console.log('*** Client Log Message: \'play_token\' \n\tpayload: '+JSON.stringify(payload));
  if(payload.result == 'fail'){
    console.log(payload.message);
    alert(payload.message);
    return;
  }
});

socket.on('game_over', function(payload){
  console.log('*** Client Log Message: \'gameover\' \n\tpayload: '+JSON.stringify(payload));
  if(payload.result == 'fail'){
    console.log(payload.message);
    return;
  }
  // jump to new page
  $('#game_over').html('<h1>Gamer Over<h1><h2>'+payload.who_won+' won!</h2>');
  $('#game_over').append('<a href="lobby.html?username='+username+'"class=btn btn-success btn-lg btn-active" role="button" aria-pressed=<"true">Return to Lobby</a>');
});


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

$('#messages').append('<h4>'+username+'</h4>');
console.log(getURlParameter('username'));

/* CONNECT TO SOCKET.IO */

var socket = io.content();

socket.on('log',function(array){
  console.log.apply(console,array);
});

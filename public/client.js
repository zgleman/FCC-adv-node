
$( document ).ready(function() {
  var socket = io();
  socket.on('user count', function(data){
      console.log(data);
    })
});
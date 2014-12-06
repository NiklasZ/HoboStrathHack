$(document).ready(function(){

  // the socket.io documentation recommends sending an explicit package upon connection
  // this is specially important when using the global namespace
  var socket = io.connect('http://' + document.domain + ':' + location.port + '/race');
  socket.on('connect', function() {
    //socket.emit('my event', {data: 'I\'m connected!'});
  });

  // event handler for server sent data
  // the data is displayed in the "Received" section of the page
  socket.on('start', function(msg) {
    $('.container').append('<br>Received #' + msg);
  });
});

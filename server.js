/*

node.js and socket.io example
server.js

*/

var util = require("util")
  , fs = require("fs")
  , path = require("path")
  , http = require("http");

var aClients = []
  , bClients = []
  , clients = []
  , pairs = [];

var server = http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write('<h1>I am a server. Watch me serve.</h1>');
    res.end();
});

server.listen(8080);

var io = require("socket.io").listen(server);

function onSocketConnection(client)
{
  clients.push(client);
  client.send('Your Session ID is ' + client.sessionId);
  client.on('message', function(msg){onMessageReceived(msg,client.sessionId);});
  client.on('disconnect', function(){onClientDisconnect(client.sessionId);});
  util.log('Client Connected. Total clients: ' + clients.length);
}

function onClientDisconnect(clientId)
{
  for(var i = 0; i < clients.length; i++)
  {
    if(clients[i].sessionId === clientId) 
    {
      clients.splice(i,1);
      break;
    }
  }
  
  //if the client disconnected was paired with another user, mark that user as unpaired
  
  util.log('Client Disconnected. Total clients: ' + clients.length);
}

function onMessageReceived(msg,sessionId)
{
  //util.log('Message Received: ' + msg);
  
  if(msg === 'pref_draw')
  {
    aClients.push({id:sessionId,paired:false});
  }
  else if(msg === 'pref_write')
  {
    bClients.push({id:sessionId,paired:false});
  }
  else
  {
    //only send to your paired user
    
    var pairId;
    
    for(var i=0; i<pairs.length; i++)
    {
      if(pairs[i].aId === sessionId) pairId = pairs[i].bId;
      else if(pairs[i].bId === sessionId) pairId = pairs[i].aId;    
    }
    
    for(var j=0; j<clients.length; j++)
    {
      if(clients[j].sessionId === pairId)
      {
        if(msg.indexOf('write_') == 0 || msg.indexOf('draw_') == 0) msg = 'from_server_' + msg;
        
        clients[j].send(msg);
      }
    }
  }
}

function checkForUnpairedUsers()
{
  if( aClients.length == 0 || bClients.length == 0 ) return;

  var shorterPref, longerPref;
  
  if(aClients.length < bClients.length)
  {
    shorterPref = aClients;
    longerPref = bClients;
  }
  else
  {
    shorterPref = bClients;
    longerPref = aClients;
  } 
  
  for(var i = 0; i < shorterPref.length; i++)
  {
    if(!shorterPref[i].paired)
    {
      for(var j=0; j < longerPref.length; j++)
      {
        if(!longerPref[j].paired)
        {
          if(shorterPref==aClients) 
            pairs.push( { aId:shorterPref[i].id, bId:longerPref[j].id } ); 
          else
            pairs.push( { aId:longerPref[j].id, bId:shorterPref[i].id } ); 
          
          shorterPref[i].paired = true;
          longerPref[j].paired = true;
          
          util.log('Paired user ' + shorterPref[i].id + ' with user ' + longerPref[j].id);
        }
      }
    }
  }
}

io.sockets.on('connection', function(socket) {
	onSocketConnection(socket);
});

setInterval(checkForUnpairedUsers,500);
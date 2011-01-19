/*

node.js and socket.io example
server.js

*/

var sys = require("sys")
  , fs = require("fs")
  , path = require("path")
  , http = require("http")
  , io = require('socket.io');

var aClients = []
  , bClients = []
  , clients = []
  , pairs = [];

var server = http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write('<h1>I am a server. Watch me serve.</h1>');
    res.end();
});

function onSocketConnection(client)
{
  clients.push(client);
  client.send('Your Session ID is ' + client.sessionId);
  client.on('message', function(msg){onMessageReceived(msg,client.sessionId);});
  client.on('disconnect', function(){onClientDisconnect(client.sessionId);});
  sys.log('Client Connected. Total clients: ' + clients.length);
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
  
  sys.log('Client Disconnected. Total clients: ' + clients.length);
}

function onMessageReceived(msg,sessionId)
{
  //sys.log('Message Received: ' + msg);
  
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
          
          sys.log('Paired user ' + shorterPref[i].id + ' with user ' + longerPref[j].id);
        }
      }
    }
  }
}

server.listen(8080);
var socket = io.listen(server);
socket.on('connection', onSocketConnection);
setInterval(checkForUnpairedUsers,500);
sys.puts('Server running at http://127.0.0.1:8080/');
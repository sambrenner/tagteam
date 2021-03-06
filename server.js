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
    res.write('<h1>I am a server! Watch me serve!</h1>');
    res.end();
});

var port = process.env.PORT || 8080;

server.listen(port);

var io = require("socket.io").listen(server);

function onSocketConnection(client)
{
  clients.push(client);
  client.send('Your Session ID is ' + client.sessionId);
  client.on('message', function(msg){onMessageReceived(msg,client.sessionId);});
  client.on('disconnect', function(){onClientDisconnect(client.sessionId);});
  console.log('Client Connected. Total clients: ' + clients.length);
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
  
  console.log('Client Disconnected. Total clients: ' + clients.length);
}

function onMessageReceived(msg,sessionId)
{
  //console.log('Message Received: ' + msg);
  
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
          
          console.log('Paired user ' + shorterPref[i].id + ' with user ' + longerPref[j].id);
          
          for(var k=0; k<clients.length; k++)
			    {
			      if(clients[k].sessionId === shorterPref[i].id || clients[k].sessionId === longerPref[j].id) {
			      	clients[k].send("paired");
			      	console.log('Sent Paired Notification!');
			      }
			    }
        }
      }
    }
  }
}

io.sockets.on('connection', function(socket) {
	onSocketConnection(socket);
});

setInterval(checkForUnpairedUsers,500);
/*

node.js and socket.io example
client.js

*/

WEB_SOCKET_SWF_LOCATION = 'http://127.0.0.1:8080/socket.io/WebSocketMain.swf';

var Utils = function() {

  return self = {
    
    getMousePositionFromEvent:function(e){
      var x,y,canvas=document.getElementById('drawcanvas');
      
      if (e.pageX || e.pageY) { 
        x = e.pageX;
        y = e.pageY;
      } else { 
        x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
        y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
      }
       
      x -= canvas.offsetLeft;
      y -= canvas.offsetTop;
      
      return [x,y];
    }
  }
}();

var TagTeam = function() {

  var _$canvas,
      _ctx,
      _socket;
  
  return self = {
    
    initDom:function(){
      _$canvas = $('#drawcanvas');
      _ctx = document.getElementById('drawcanvas').getContext('2d');
    
      $('section').each(function(i){
        $(this).hide();
      });
    },
    
    initCanvas:function(){
      _$canvas.bind('mousedown', self.onCanvasMouseDown);
    },
    
    initSocket:function(){
      
      try {
        _socket = new io.Socket('127.0.0.1', {port:8080});
      } catch(e) {
        $('#init').hide();
        $('#error').show();
        return;
      }
        
      _socket.on('connect', self.onSocketConnect);
      _socket.on('message', self.onSocketMessageArrival);
      _socket.on('close', self.onSocketClose);
      _socket.on('disconnect', self.onSocketDisconnect);
      
      _socket.connect();
      
    },
        
    onSocketConnect:function(){
      $('#init').hide();
      $('#welcome').show();
      
      self.bindPreferenceClicks();
      
      $('#log').append('<li>Connect</li>');
    },
    
    onSocketMessageArrival:function(msg){
      var writeCode = 'from_server_write_',
          drawCode = 'from_server_draw_';
      
      if(msg.indexOf(writeCode) == 0)
      {
        $('#writebox textarea').val(msg.slice(writeCode.length));
      }
      else if(msg.indexOf(drawCode) == 0) 
      {
        var img = new Image();
        img.src = msg.slice(drawCode.length);
        _ctx.drawImage(img,0,0);
      }
    },
    
    onSocketClose:function(){
      $('#log').append('<li>Close</li>');
    },
    
    onSocketDisconnect:function(){
      $('#log').append('<li>Disconnect</li>');
    },
    
    bindPreferenceClicks:function(){
      $('#welcome a').each(function(i){
        switch($(this).attr('href')){
          case '#draw':
            $(this).bind('click',function(){self.onPreferenceSelect('draw')});
            break;
          case '#write':
            $(this).bind('click',function(){self.onPreferenceSelect('write')});
            break;
        }
      });
    },
    
    onPreferenceSelect:function(pref){
      _socket.send('pref_' + pref);
    
      $('#welcome').hide();
      
      $('#chat').show();
      $('#drawbox').show();
      $('#writebox').show();
      
      if(pref=='write') setInterval(self.sendWriting,500);
      else if(pref=='draw') setInterval(self.sendDrawing,500);
    },
    
    onCanvasMouseDown:function(e){
      _$canvas.unbind('mousedown', self.onCanvasMouseDown);
      _$canvas.bind('mousemove', self.onCanvasMouseMove);
      _$canvas.bind('mouseup', self.onCanvasMouseUp);
      
      var mousePos = Utils.getMousePositionFromEvent(e);
      
      _ctx.beginPath();
      _ctx.moveTo(mousePos[0],mousePos[1]);
    },
    
    onCanvasMouseMove:function(e){
      var mousePos = Utils.getMousePositionFromEvent(e);
      
      _ctx.lineTo(mousePos[0],mousePos[1]);
      _ctx.stroke();
    },
    
    onCanvasMouseUp:function(e){
      _ctx.stroke();
    
      _$canvas.unbind('mousemove', self.onCanvasMouseMove);
      _$canvas.unbind('mouseup', self.onCanvasMouseUp);
      _$canvas.bind('mousedown', self.onCanvasMouseDown);
    },
    
    sendDrawing:function(){
      _socket.send('draw_' + document.getElementById('drawcanvas').toDataURL());
    },
    
    sendWriting:function(){
      _socket.send('write_' + $('#writebox textarea').val());
    }
  }
}();

$(document).ready(function(){
  TagTeam.initDom();  
  TagTeam.initCanvas();
  TagTeam.initSocket();
});
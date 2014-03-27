/*global require, module, __dirname */
/*jslint node: true */
"use strict";
/**
 * Module dependencies.
 */
var express = require('express');
var debug = require('debug')('http');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

/*
var app = express();
// all environments
app.set('port', process.env.PORT || 80);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
*/

// Socket IO code Start
var socketIO = require('socket.io');
var chatApp = express();
var chatServer = http.createServer(chatApp);
var io = socketIO.listen(chatServer);
var fs = require('fs');

// Listen to port 80
chatApp.set('port', process.env.PORT || 80);
chatApp.set('views', path.join(__dirname, 'views'));
//@todo change this to not jade, (use hbs)
chatApp.set('view engine', 'jade');
chatApp.use(express.favicon());
chatApp.use(express.logger('dev'));
chatApp.use(express.json());
chatApp.use(express.urlencoded());
chatApp.use(express.methodOverride());
chatApp.use(chatApp.router);

// Enable the application to view the public folder
chatApp.use(express.static(path.join(__dirname, 'public')));
chatApp.get('/', routes.index);
chatApp.get('/users', user.list);
chatServer.listen(chatApp.get('port'), function () {
  console.log('Express + websocket server listening on port ' + chatApp.get('port'));
});

chatApp.get('/chat', function (req, res) {
  res.sendfile(chatApp.get('views') + '/chat.html');
});


// Remember var 'io' is just socketIO.listen(chatServer);
io.sockets.on('connection', function (socket) {
  var file = __dirname + '/public/json/file.json';
  var jsonFile;
  var jsonTemp = '';
  var messageArray = [];
  fs.readFile(file, 'utf8', function (err, data) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }
    jsonFile = JSON.parse(data);
    messageArray = jsonFile;
    socket.emit('loadJSON', jsonFile);
  });
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });

  socket.on('send event', function (data) {
    var d = new Date();
    var timeStamp = d.toISOString();
    var message = { 'timestamp' : timeStamp, 'data': {'username': data.username, 'message': data.message} };
    //var message = { 'log': d.toDateString() + ' - ' + d.toLocaleTimeString() + ': ' + data.message };
    messageArray.push(message);
    fs.writeFile(file, JSON.stringify(messageArray, null, 2), function (err, data) {
      if (err) {
        console.log('Error: ' + err);
        return;
      }
    });
    socket.emit('watchlog', message);
    socket.broadcast.emit('watchlog', message);
  });
  socket.on('clear form', function () {
    messageArray = [];
    fs.writeFile(file, JSON.stringify(messageArray, null, 2), function (err, data) {
      if (err) {
        console.log('Error: ' + err);
        return;
      }
    });
    socket.emit('watchlog', 'clear');
    socket.broadcast.emit('watchlog', 'clear');
  });
});
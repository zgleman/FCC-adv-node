"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require("express-session");
const passport = require("passport");
const app = express();
const mongo = require("mongodb").MongoClient;
const http        = require('http').Server(app);
const sessionStore= new session.MemoryStore();
const io = require('socket.io')(http);
const passportSocketIo = require('passport.socketio');
const cookieParser= require('cookie-parser');
const routes = require('./Routes.js');
const auth = require('./Auth.js');




app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
  })
);



fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "pug");

mongo.connect(process.env.DATABASE, (err, db) => {
  if (err) {
    console.log("Database error: " + err);
  } else {
    console.log("Successful database connection");
    auth(app, db);
    routes(app, db);
    
    
    
    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });
    
    io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,
  key:          'express.sid',
  secret:       process.env.SESSION_SECRET,
  store:        sessionStore
}));
    
  var currentUsers = 0;  
io.on('connection', socket => {
  ++currentUsers;
  io.emit('user', {name: socket.request.user.name, currentUsers, connected: true});
  console.log('user ' + socket.request.user.name + ' connected');
  
   socket.on('chat message', (message) => {
        io.emit('chat message', {name: socket.request.user.name, message});
      });
  
   socket.on('disconnect', () => { 
     console.log('A user has disconnected');
     --currentUsers;
     io.emit('user', {name: socket.request.user.name, currentUsers, connected: false});;
                                 });
});

    
  }
});

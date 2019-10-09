"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require("express-session");
const passport = require("passport");
const app = express();
const mongo = require("mongodb").MongoClient;
const GitHubStrategy = require('passport-github').Strategy;
const io = require('socket.io');
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
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: 'https://zgleman-advnode.glitch.me/auth/github/callback'
    }, function(accessToken, refreshToken, profile, cb){
      console.log(profile);
      db.collection('socialusers').findAndModify(
      {id: profile.id},
      {},
      {$setOnInsert: {
        id: profile.id,
        name: profile.displayName,
        photo: profile.photos[0].value,
        email: profile.emails[0].value,
        created_on: new Date(),
        provider: profile.provider
      }, $set:{
        last_login: new Date()
      }, $inc:{
        login_count: 1
      }}, {upsert: true, new: true}, (err, doc)=>{return cb(null, doc.value);
                                                 });
    }));
    
    routes(app, db);
    app.route("/auth/github")
        .get(passport.authenticate('github'));
    
    app.route("/auth/github/callback")
        .get(passport.authenticate('github', {failureRedirect: '/'}), function(req, res){
      res.redirect('/profile');
    });
    
    


  }
});

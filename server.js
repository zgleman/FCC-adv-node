"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require("express-session");
const passport = require("passport");
const app = express();
const mongo = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectId;
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const routes = require('./routes.js')
process.env.SESSION_SECRET = 23.4;
process.env.DATABASE =
  "mongodb://zgleman:grey1127@cluster0-shard-00-00-2my3z.mongodb.net:27017,cluster0-shard-00-01-2my3z.mongodb.net:27017,cluster0-shard-00-02-2my3z.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority";

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
  })
);

app.use(passport.initialize());
app.use(passport.session());

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

    passport.serializeUser((user, done) => {
      done(null, user._id);
    });
    passport.deserializeUser((id, done) => {
      db.collection("users").findOne({ _id: new ObjectID(id) }, (err, doc) => {
        done(null, doc);
      });
    });
    
    passport.use(
      new LocalStrategy(function(username, password, done) {
        db.collection("users").findOne({ username: username }, function(err, user) {
          console.log("User " + username + " attempted to log in.");
          if (err) { return done(err); }
          if (!user) { return done(null, false); }
          if (!bcrypt.compareSync(password, user.password)) { return done(null, false); }
          return done(null, user);
        });
      })
    );

    function ensureAuthenticated(req, res, next) {
      if (req.isAuthenticated()) {
        return next();
      }
      res.redirect("/");
    };

    app.route("/").get((req, res) => {
      res.render(process.cwd() + "/views/pug/index.pug", {
        title: "Home Page",
        message: "Please login",
        showLogin: true,
        showRegistration: true
      });
    });

    app.route("/profile").get(ensureAuthenticated, function(req, res) {
      res.render(process.cwd() + "/views/pug/profile", {
        username: req.user.username
      });
    });
    app.route("/login")
       .post(passport.authenticate("local", { failureRedirect: "/" }), function(req, res) {
        res.redirect("/profile");
      });
    
    app.route("/register")
      .post(function(req, res, next) {
        db.collection("users").findOne(
          { username: req.body.username },
          function(err, user) {
            if (err) {
              next(err);
            } else if (user) {
              res.redirect("/");
            } else {
              var hash = bcrypt.hashSync(req.body.password, 12);
              db.collection("users").insertOne(
                {
                  username: req.body.username,
                  password: hash
                },
                (err, doc) => {
                  if (err) {
                    res.redirect("/");
                  } else {
                    next(null, user);
                  }
                }
              );
            }
          }
        );
      },
      passport.authenticate("local", { failureRedirect: "/" }), function(req, res, next) {
        res.redirect("/profile");
      });

    app.get("/logout", function(req, res) {
      req.logout();
      res.redirect("/");
    });

    app.use((req, res, next) => {
      res
        .status(404)
        .type("text")
        .send("Not Found");
    });
    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });
  }
});

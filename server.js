"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require("express-session");
const passport = require("passport");
const app = express();
const mongo = require("mongodb").MongoClient;


const routes = require('./Routes.js');
const auth = require('./Auth.js');

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
    
    
    


  }
});

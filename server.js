'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const app = express();
const mongo = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectId;

process.env.SESSION_SECRET = 23.4;
process.env.DATABASE = 'mongodb+srv://zgleman:grey1127@cluster0-2my3z.mongodb.net/test?retryWrites=true&w=majority';

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug');
app.route('/')
  .get((req, res) => {
    res.render(process.cwd() + '/views/pug/index.pug', {title: 'Hello', message: 'Please login'});
  });

mongo.connect(process.env.DATABASE, (err, db) => {
    if(err) {
        console.log('Database error: ' + err);
    } else {
        console.log('Successful database connection');
      
passport.serializeUser((user, done)=>{
  done(null, user._id);
});
passport.deserializeUser((id, done)=>{
  db.collection('users').findOne(
  {_id: new ObjectID(id)},
  (err, doc)=> {
    done(null, doc);
  });
  
});



app.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port " + process.env.PORT);
});
    }});
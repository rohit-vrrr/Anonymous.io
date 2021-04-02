//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// creating DB
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});

// creating Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// creating Model
const User = mongoose.model("User", userSchema);

app.get('/', function(req, res) {
  res.render("home");
});

app.get('/login', function(req, res) {
  res.render("login");
});

app.post('/login', function(req, res) {
  const userName = req.body.username;
  const password = md5(req.body.password);

  User.findOne({email: userName}, function(err, result){
    if(err) {
      console.log(err);
    } else {
      if(result) {
        if(result.password === password) {
          res.render("secrets");
        }
      }
    }
  });
});

app.get('/register', function(req, res) {
  res.render("register");
});

app.post('/register', function(req, res) {
  const newUser = new User({
    email: req.body.username,
    password: md5(req.body.password)
  });

  newUser.save(function(err) {
    if(err) {
      console.log(err);
    } else {
      res.render("secrets");
    }
  });
});

app.listen(3000, function() {
  console.log("Server listening on port 3000");
});

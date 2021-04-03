//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// session setup
app.use(session({
  secret: "A secret.",
  resave: false,
  saveUninitialized: false
}));

// passport setup
app.use(passport.initialize());
app.use(passport.session());

// creating DB
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

// creating Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// initializing plugin for 'passport-local-mongoose'
userSchema.plugin(passportLocalMongoose);

// creating Model
const User = mongoose.model("User", userSchema);

// 'passport-local' configuration
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', function(req, res) {
  res.render("home");
});

app.get('/login', function(req, res) {
  res.render("login");
});

app.post('/login', function(req, res) {

});

app.get('/register', function(req, res) {
  res.render("register");
});

app.post('/register', function(req, res) {

});

app.listen(3000, function() {
  console.log("Server listening on port 3000");
});

//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require("mongoose-findorcreate");

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
  password: String,
  googleId: String,
  facebookId: String,
  secret: String
});

// initializing plugin for 'passport-local-mongoose'
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// creating Model
const User = mongoose.model("User", userSchema);

// 'passport-local' configuration
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// Google configure strategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/anonymous",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// Facebook configure Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.CLIENT_ID_FB,
    clientSecret: process.env.CLIENT_SECRET_FB,
    callbackURL: "http://localhost:3000/auth/facebook/anonymous"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//////////////////// Home route ////////////////////
app.route('/')
  .get(function(req, res) {
    res.render("home");
  });

//////////////////// Google route ////////////////////
app.route('/auth/google')
  .get(passport.authenticate("google", { scope: ['profile'] }));

app.route('/auth/google/anonymous')
  .get(passport.authenticate("google", { failureRedirect: '/login' }), function(req, res) {
    res.redirect('/secrets');
  });

//////////////////// Facebook route ////////////////////
app.route('/auth/facebook')
  .get(passport.authenticate("facebook"));

app.route('/auth/facebook/anonymous')
  .get(passport.authenticate("facebook", { failureRedirect: '/login' }), function(req, res) {
    res.redirect('/secrets');
  });

//////////////////// Login route ////////////////////
app.route('/login')
  .get(function(req, res) {
    res.render("login");
  })

  .post(function(req, res) {

    const user = new User({
      username: req.body.username,
      password: req.body.password
    });

    req.login(user, function(err) {
      if(err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect('/secrets');
        });
      }
    });

  });

//////////////////// Register route ////////////////////
app.route('/register')
  .get(function(req, res) {
    res.render("register");
  })

  .post(function(req, res) {

    User.register({username: req.body.username}, req.body.password, function(err, user) {
      if(err) {
        console.log(err);
        res.redirect('/register');
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect('/secrets');
        });
      }
    });

  });

//////////////////// Secrets route ////////////////////
app.route('/secrets')
  .get(function(req, res) {
    User.find({"secret": {$ne: null}}, function(err, foundUsers) {
      if(err) {
        console.log(err);
      } else {
        if(foundUsers) {
          res.render('secrets', {usersWithSecrets: foundUsers});
        }
      }
    });
  });

//////////////////// Submit route ////////////////////
app.route('/submit')
  .get(function(req, res) {
    if(req.isAuthenticated()) {
      res.render("submit");
    } else {
      res.redirect("/login");
    }
  })

  .post(function(req, res) {
    const submittedSecret = req.body.secret;

    User.findById(req.user.id, function(err, foundUser) {
      if(err)
        console.log(err);
      else {
        if(foundUser) {
          foundUser.secret = submittedSecret;
          foundUser.save(function() {
            res.redirect('/secrets');
          });
        }
      }
    });
  });

//////////////////// Logout route ////////////////////
app.route('/logout')
  .get(function(req, res) {
    req.logout();
    res.redirect('/');
  });

app.listen(3000, function() {
  console.log("Server listening on port 3000");
});

require('dotenv').config();// We just need to call config on this package, that's why we don't have to set up constant for it.
// It is important that the package environments at the top. 
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate'); // This will allow the use of the findOrCreate function.


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// The lines below have be under the lines above
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
// The line above should come before the line below.

mongoose.connect('mongodb://localhost:27017/userDB');

const {Schema} = mongoose;

const userSchema = new Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose); // This will be used save users, salt and hash their passwords.
userSchema.plugin(findOrCreate); 

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

// used to serialize the user for the session
passport.serializeUser(function(user, done) {
    done(null, user.id); 
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

// Setting up the google strategy.
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res) {
    res.render("home");
});

// Authenticating the user using passport with the google strategy.
app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })); // The profile here includes the email and user ID on Google.

//Redirecting the user to our website. This get request is made by Google.
app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/register", function(req, res) {
    res.render("register");
});

// Rendering the secrets page.
app.get("/secrets", function(req, res) {
    User.find({"secret": {$ne: null}}, function(err, foundUsers) {
        if (err) {
            console.log(err);
        } else {
            if (foundUsers) {
                res.render("secrets", {usersWithSecrets: foundUsers});
            }
        }
    });
});

app.get("/submit", function(req, res) {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }   
});

// Submitting and saving a secret.
app.post("/submit", function(req, res) {
    const submittedSecret = req.body.secret;

    console.log(req.user);

    User.findById(req.user.id, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(function() {
                    res.redirect("/secrets");
                });
            }
        }
    });
});

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});

// Registering an account
app.post("/register", function(req, res) {

    User.register({username: req.body.username}, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            })
        }
    });

});

//Logging into an account
app.post("/login", passport.authenticate("local"), function(req, res){
    res.redirect("/secrets");
}); 


app.listen(3000, function() {
    console.log("Server started on port 3000.");
});

require('dotenv').config();// We just need to call config on this package, that's why we don't have to set up constant for it.
// It is important that the package environments at the top. 
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

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
    password: String
});

userSchema.plugin(passportLocalMongoose); // This will be used save users, salt and hash their passwords.

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res) {
    res.render("home");
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/register", function(req, res) {
    res.render("register");
});

app.get("/secrets", function(req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
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

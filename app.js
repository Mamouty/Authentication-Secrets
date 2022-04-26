require('dotenv').config();// We just need to call config on this package, that's why we don't have to set up constant for it.
// It is important that the package environments at the top. 
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");

const app = express();

console.log(process.env.API_KEY);

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended: true}));

mongoose.connect('mongodb://localhost:27017/userDB');

const {Schema} = mongoose;

const userSchema = new Schema({
    email: String,
    password: String
});



const User = mongoose.model('User', userSchema);

app.get("/", function(req, res) {
    res.render("home");
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/register", function(req, res) {
    res.render("register");
});

// Registering an account
app.post("/register", function(req, res) {
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    });

    newUser.save(function(err) {
        if (err) {
            console.log(err);
        } else {
            // The secrets page can only be accessed if the user is registered or logged in.
            res.render("secrets");
        }
    });
});

//Logging into an account
app.post("/login", function(req, res) {
    const username = req.body.username;
    const password = md5(req.body.password);
    User.findOne({email: username}, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                if (foundUser.password === password) {
                    res.render("secrets");
                }
            }

        }
    });
});


app.listen(3000, function() {
    console.log("Server started on port 3000.");
});

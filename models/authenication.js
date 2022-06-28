const mongoose = require('mongoose');

var authSchema = new mongoose.Schema({
    name : String,
    mobile : Number,
    email : String,
    password : String
});

const authenication = mongoose.model("authenication",authSchema);

module.exports = authenication;
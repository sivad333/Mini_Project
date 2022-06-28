const mongoose = require('mongoose');

var otpSchema = new mongoose.Schema({
    userID : String,
    otp : String,
    createdAt : Date,
    expiresAt : Date
});

const otpVerification = mongoose.model("otpVerification",otpSchema);

module.exports = otpVerification;
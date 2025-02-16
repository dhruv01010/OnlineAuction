const mongoose = require('mongoose');

const registerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: [true, "Email already exists"]
    },
    password: {
        type: String,
        required: true
    },
    resetToken: { 
        type: String 
    },
    resetTokenExpiration: { 
        type: Date 
    }
});

const Register = mongoose.model("Register", registerSchema);

module.exports = Register;

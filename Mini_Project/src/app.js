const express = require('express');
const path = require('path');
const hbs = require('hbs');
const app = express();
const connectDB = require('./db/conn');
const Register = require('./models/register');
const nodemailer = require("nodemailer");
require('dotenv').config();

const port = process.env.PORT || 3000;

const static_path = path.join(__dirname, "../public");
const views_path = path.join(__dirname, "../templates/views");
const partials_path = path.join(__dirname, "../templates/partials");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(static_path));
app.set("view engine", "hbs");
app.set("views", views_path);
hbs.registerPartials(partials_path);

app.get('/', (req, res) => {
  res.render("index");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmpassword } = req.body;

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com)$/;
    const passwordRegex = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,8}$/;

    if (!emailRegex.test(email)) {
      return res.status(400).send("Invalid email format. It must contain '@' and end with '.com'");
    }

    if (!passwordRegex.test(password)) {
      return res.status(400).send("Password must be 6-8 characters long and include at least one special character.");
    }

    if (password !== confirmpassword) {
      return res.status(400).send("Passwords do not match");
    }

    // Creating new user
    const registerEmployee = new Register({ name, email, password });
    await registerEmployee.save();

    res.status(201).render("index");
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).send("Server error during registration");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Register.findOne({ email });

    if (user && user.password === password) {
      res.status(200).render("index");
    } else {
      res.status(401).send("Invalid email or password");
    }
  } catch (err) {
    res.status(500).send("Server error during login");
  }
});

app.get("/forgot_password", (req, res) => {
  res.render("forgot_password");
});

app.post("/forgot_password", async (req, res) => {
  try {
    const { name, email, newpassword, confirmpassword } = req.body;

    const passwordRegex = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,8}$/;

    if (!passwordRegex.test(newpassword)) {
      return res.status(400).send("Password must be 6-8 characters long and include at least one special character.");
    }

    if (newpassword !== confirmpassword) {
      return res.status(400).send("Passwords do not match.");
    }

    const user = await Register.findOne({ name, email });
    if (!user) {
      return res.status(404).send("No user found with this username and email.");
    }

    // Update only the password field
    user.password = newpassword;
    await user.save();

    res.status(200).redirect("/login");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing password reset.");
  }
});


// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

app.get("/passwordless_login", (req, res) => {
  res.render("passwordless_login");
});

app.post("/forgot_password", async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the user exists
    const user = await Register.findOne({ email });

    if (!user) {
      return res.status(404).send("Email is not registered. Please check and try again.");
    }

    // Generate reset token
    const resetToken = Math.random().toString(36).substr(2);
    const resetLink = `http://localhost:${port}/reset_password/${resetToken}`;

    // Send email for password reset
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request",
      text: `Click the link to reset your password: ${resetLink}`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).send(`Password reset link sent to ${email}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing your request.");
  }
});

const start = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`Server is running at port number ${port}`);
    });
  } catch (err) {
    console.error(err);
  }
};

start();

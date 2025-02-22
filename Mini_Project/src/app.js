const express = require('express');
const expressSession = require('express-session');
const path = require('path');
const hbs = require('hbs');
const app = express();
const connectDB = require('./db/conn');
const Register = require('./models/register');
const nodemailer = require("nodemailer");
const otpGenerator = require('otp-generator');
require('dotenv').config();
const MongoStore = require("connect-mongo");
const axios = require('axios');

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

// Set up the session middleware
app.use(
  expressSession({
    secret: process.env.SESSION_SECRET || 'your-secret-key',  // Session secret key for encryption
    resave: false,  // Don't save session if it hasn't been modified
    saveUninitialized: true,  // Create a session for every user, even if not logged in
    store: MongoStore.create({
      mongoUrl: 'mongodb+srv://user1000:user111@onlineauction.9paem.mongodb.net/OnlineAuction',  // Store sessions in MongoDB
      collectionName: 'sessions',
    }),
    cookie: { maxAge: 1000 * 60 * 1 },
  })
);


const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();  // If the user is logged in, continue to the dashboard
  } else {
    res.status(401).send("You need to log in to access this page.");  // Deny access if not logged in
  }
};

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.get("/index", (req, res) => {
  res.render("index");  // Render the index page without authentication check
});

// Use the middleware for protected routes
app.get("/index", isAuthenticated, (req, res) => {
  res.render("index");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  try {
      const { name, email, password } = req.body;

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
          return res.status(400).send("Invalid email format");
      }

      // Third-party email validation
      const apiKey = "4c93291a2b1e4121a4cf0a4173d97845"; // Replace with your actual API key
      //https://app.abstractapi.com/api/email-validation/tester     <-- link for email validation

      const validationUrl = `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${email}`;

      const response = await axios.get(validationUrl);
      console.log("API Response:", response.data); // Debug log

      if (response.data.deliverability !== "DELIVERABLE") {
          return res.status(400).send("Invalid or undeliverable email address.");
      }

      // Check if the email already exists
      const existingUser = await Register.findOne({ email });
      if (existingUser) {
          return res.status(409).send("Email already registered");
      }

      // Create and save the new user
      const newUser = new Register({ name, email, password });
      await newUser.save();

      req.session.user = newUser; // Auto-login after registration
      res.redirect("/login");
  } catch (err) {
      console.error("Error during registration:", err.response ? err.response.data : err);
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
      // Store user information in the session after successful login
      req.session.user = user;  // Store the user object in the session

      return res.redirect("/index");  // Redirect to the dashboard
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

    const passwordRegex = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,10}$/;

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

app.get("/passwordless_login", (req, res) => {
  res.render("passwordless_login");
});

// OTP storage (in-memory for simplicity)
const otpStore = {};

// Passwordless login - Send OTP
app.post("/send-otp", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await Register.findOne({ email });

        if (!user) {
            return res.status(404).send("Email not registered");
        }

        const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
        otpStore[email] = otp;

        // Configure nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'your-email@gmail.com', // Replace with your email
                pass: 'your-email-password'   // Replace with your email password or app password
            }
        });

        await transporter.sendMail({
            from: 'your-email@gmail.com',
            to: email,
            subject: 'Your Login Code',
            text: `Your login code is: ${otp}`
        });

        res.status(200).send("OTP sent to your email");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error sending OTP");
    }
});

// Passwordless login - Verify OTP
app.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (otpStore[email] && otpStore[email] === otp) {
            const user = await Register.findOne({ email });
            if (user) {
                req.session.user = user;
                delete otpStore[email];
                return res.redirect("/index");
            }
        }
        res.status(401).send("Invalid OTP or email");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error verifying OTP");
    }
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {  // Destroy the session
    if (err) {
      return res.status(500).send("Error logging out");
    }
    res.redirect("/");  // Redirect to the homepage or login page
  });
});

app.get("/auctions", async (req, res) => {
  const auctions = [
    { _id: "1", title: "Antique Vase", description: "18th century antique vase.", currentBid: 150, image: "/imgs/vase.jpg" },
    { _id: "2", title: "Vintage Watch", description: "Classic timepiece in excellent condition.", currentBid: 300, image: "/imgs/watch.jpg" },
    { _id: "3", title: "Painting", description: "Original oil painting by a renowned artist.", currentBid: 500, image: "/imgs/painting.jpg" },
  ];

  res.render("auctions", { auctions, user: req.session.user }); // Pass user session
});

// Route for handling bids
app.post("/bid/:id", (req, res) => {
  const { id } = req.params;
  const { bidAmount } = req.body;
  console.log(`Bid of $${bidAmount} placed on auction item with ID ${id}`);
  res.redirect("/auctions");
});

// Login route (sets user session)
app.post("/login", (req, res) => {
  const { username } = req.body;
  req.session.user = { username }; // Storing user data in session
  res.redirect("/auctions");
});

// Logout route (destroys session)
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.log(err);
    res.redirect("/"); // Redirect after logout
  });
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

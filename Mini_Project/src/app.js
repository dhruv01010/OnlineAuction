const express = require('express');
const expressSession = require('express-session');
const path = require('path');
const hbs = require('hbs');
const app = express();
const connectDB = require('./db/conn');
const Register = require('./models/register');
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

app.use(
  expressSession({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: 'mongodb://localhost:27017/my_db?ssl=false',
      collectionName: 'sessions',
    }),
    cookie: { maxAge: 1000 * 60 * 60 }, // 1 hour session expiry
  })
);

const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();  // If the user is logged in, continue to the dashboard
  } else {
    res.status(401).send("You need to log in to access this page.");  // Deny access if not logged in
  }
};

// Middleware to make user session available in all templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Route for home page
app.get("/", (req, res) => {
  res.render("index", { user: req.session.user });
});

// Use the middleware for protected routes
app.get("/index", isAuthenticated, (req, res) => {
  res.render("index");
});

// Ensure that "/home" also redirects properly with the user session
app.get("/home", (req, res) => {
  res.render("index", { user: req.session.user });
});

// Registration Route
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

// Login Route
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Register.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    req.session.user = user;
    if (user.password === password) {
      return res.redirect("/index");
    }else{
      return res.json({ success: true });
    }
  } catch (err) {
    console.error("Server error during login:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/forgot_password", (req, res) => {
  res.render("forgot_password");
});

app.post("/forgot_password", async (req, res) => {
  try {
    const { name, email, newpassword, confirmpassword } = req.body;

    const user = await Register.findOne({ name, email });

    if (!user) {
      return res.render("forgot_password", {
        errorMessage: "Invalid email or username",
        name,
        email,
      });
    }
    if (newpassword !== confirmpassword) {
      return res.render("forgot_password", {
        errorMessage: "Passwords do not match",
        name,
        email,
      });
    }
    user.password = newpassword;
    await user.save();

    return res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing password reset.");
  }
});

app.get("/passwordless_login", (req, res) => {
  res.render("passwordless_login");
});

app.get("/reset_password", (req, res) => {
  res.render("reset_password");
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

// Logout Route
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error logging out");
    }
    res.redirect("/");
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

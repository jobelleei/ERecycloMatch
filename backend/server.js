const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors()); // allows cross-origin requests from the mobile app
app.use(express.json()); // parses incoming JSON requests
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // serves uploaded images as static files


const db = mysql.createConnection({
  host: "localhost",
  user: "root",       // XAMPP default username
  password: "",       // XAMPP default password (empty)
  database: "capstone_db", // database name in phpMyAdmin
});

db.connect((err) => {
  if (err) throw err;
  console.log("MySQL connected!");
});

// FILE UPLOAD SETUP (MULTER)
// handles certification image uploads for facility signup
// uploaded files are saved in the /uploads folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "uploads/")),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname)); // generates unique filename
  },
});
const upload = multer({ storage });

// ROOT ROUTE
// used to test if the backend is reachable from the mobile app
// open http://YOUR_IP:5000/ in phone browser to verify connection
app.get("/", (req, res) => {
  res.json({ message: "Backend connected!" });
});

// INDIVIDUAL SIGNUP ROUTE
// saves to: 'individuals' table in capstone_db database
// fields: name, email, address, password
app.post("/api/individual-signup", async (req, res) => {
  console.log("Individual signup request:", req.body);
  const { name, email, address, password, confirmpass } = req.body;

  // validation - check if all fields are filled
  if (!name || !email || !address || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  // validation - check if passwords match
  if (password !== confirmpass) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // encrypt password before saving
    const sql = `INSERT INTO individuals (name, email, address, password) VALUES (?, ?, ?, ?)`;

    db.query(sql, [name, email, address, hashedPassword], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "Email already registered." });
        }
        return res.status(500).json({ message: "Database error." });
      }
      res.status(201).json({ message: "Account created successfully!" });
    });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// FACILITY SIGNUP ROUTE
// called from: app/facility_signup.tsx
// saves to: 'facilities' table in erecyclomatch database
// fields: name, location, email, contactNum, password, certification image
app.post("/api/facility-signup", upload.single("certification"), async (req, res) => {
  console.log("Facility signup request:", req.body);
  const { name, location, email, contactNum, password, confirmpass } = req.body;

  // validation - check if all fields are filled
  if (!name || !location || !email || !contactNum || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  // validation - check if passwords match
  if (password !== confirmpass) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  // validation - check if certification image was uploaded
  if (!req.file) {
    return res.status(400).json({ message: "Certification document is required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // encrypt password before saving
    const certificationPath = req.file.filename; // filename of uploaded certification image
    const sql = `INSERT INTO facilities (name, location, email, contact_num, password, certification_image) VALUES (?, ?, ?, ?, ?, ?)`;

    db.query(sql, [name, location, email, contactNum, hashedPassword, certificationPath], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "Email already registered." });
        }
        return res.status(500).json({ message: "Database error." });
      }
      res.status(201).json({ message: "Facility registered successfully!" });
    });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// SIGN IN ROUTE
// called from: app/signin.tsx
// checks both 'individuals' and 'facilities' tables
// returns userType: 'individual' or 'facility' for routing
app.post("/api/signin", async (req, res) => {
  const { email, password } = req.body;

  // validation - check if all fields are filled
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  // first check in individuals table
  db.query("SELECT * FROM individuals WHERE email = ?", [email], async (err, individualResults) => {
    if (err) return res.status(500).json({ message: "Database error." });

    if (individualResults.length > 0) {
      const user = individualResults[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ message: "Incorrect password." });
      return res.status(200).json({ message: "Login successful!", userType: "individual", user });
    }

    // if not found in individuals, check facilities table
    db.query("SELECT * FROM facilities WHERE email = ?", [email], async (err, facilityResults) => {
      if (err) return res.status(500).json({ message: "Database error." });

      if (facilityResults.length > 0) {
        const user = facilityResults[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ message: "Incorrect password." });
        return res.status(200).json({ message: "Login successful!", userType: "facility", user });
      }

      // if email not found in either tabl
      return res.status(404).json({ message: "Email not registered." });
    });
  });
});

// runs on port 5000
// make sure to run 'node server.js' from the backend folder
app.listen(5000, () => console.log("Server running on port 5000"));
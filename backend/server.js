const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Auto-create uploads folder if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads/ directory");
}

app.use("/uploads", express.static(uploadsDir));

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "capstone_db",
  socketPath: "/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock",
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err.message);
    return;
  }
  console.log("MySQL connected!");

  // ✅ Auto-create tables if they don't exist
  const createIndividualsTable = `
    CREATE TABLE IF NOT EXISTS individuals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      address TEXT NOT NULL,
      password VARCHAR(255) NOT NULL,
      id_image VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createFacilitiesTable = `
    CREATE TABLE IF NOT EXISTS facilities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      location TEXT NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      contact_num VARCHAR(50) NOT NULL,
      password VARCHAR(255) NOT NULL,
      certification_image VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.query(createIndividualsTable, (err) => {
    if (err) console.error("Error creating individuals table:", err.message);
    else console.log("individuals table ready.");
  });

  db.query(createFacilitiesTable, (err) => {
    if (err) console.error("Error creating facilities table:", err.message);
    else console.log("facilities table ready.");
  });
});

// FILE UPLOAD SETUP (MULTER)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

// ✅ Only accept image files, max 5MB
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpeg, png, webp) are allowed."), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ROOT ROUTE
app.get("/", (req, res) => {
  res.json({ message: "Backend connected!" });
});

// INDIVIDUAL SIGNUP ROUTE
app.post("/api/individual-signup", upload.single("id_image"), async (req, res) => {
  console.log("Individual signup — body:", req.body);
  console.log("Individual signup — file:", req.file);

  const { name, email, address, password, confirmpass } = req.body;

  if (!name || !email || !address || !password || !confirmpass) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (password !== confirmpass) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const idImagePath = req.file ? req.file.filename : null;
    const sql = `INSERT INTO individuals (name, email, address, password, id_image) VALUES (?, ?, ?, ?, ?)`;

    db.query(sql, [name, email, address, hashedPassword, idImagePath], (err, result) => {
      if (err) {
        console.error("DB ERROR (individual-signup):", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "Email already registered." });
        }
        return res.status(500).json({ message: "Database error." });
      }
      console.log("Individual created with ID:", result.insertId);
      res.status(201).json({ message: "Account created successfully!" });
    });
  } catch (err) {
    console.error("Server error (individual-signup):", err);
    res.status(500).json({ message: "Server error." });
  }
});

// FACILITY SIGNUP ROUTE
app.post("/api/facility-signup", upload.single("certification"), async (req, res) => {
  console.log("Facility signup — body:", req.body);
  console.log("Facility signup — file:", req.file);

  const { name, location, email, contactNum, password, confirmpass } = req.body;

  if (!name || !location || !email || !contactNum || !password || !confirmpass) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (password !== confirmpass) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Certification document is required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const certificationPath = req.file.filename;
    const sql = `INSERT INTO facilities (name, location, email, contact_num, password, certification_image) VALUES (?, ?, ?, ?, ?, ?)`;

    db.query(sql, [name, location, email, contactNum, hashedPassword, certificationPath], (err, result) => {
      if (err) {
        console.error("DB ERROR (facility-signup):", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "Email already registered." });
        }
        return res.status(500).json({ message: "Database error." });
      }
      console.log("Facility created with ID:", result.insertId);
      res.status(201).json({ message: "Facility registered successfully!" });
    });
  } catch (err) {
    console.error("Server error (facility-signup):", err);
    res.status(500).json({ message: "Server error." });
  }
});

// SIGN IN ROUTE
app.post("/api/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  db.query("SELECT * FROM individuals WHERE email = ?", [email], async (err, individualResults) => {
    if (err) return res.status(500).json({ message: "Database error." });

    if (individualResults.length > 0) {
      const user = individualResults[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ message: "Incorrect password." });

      // ✅ Strip hashed password before sending to client
      const { password: _pw, ...safeUser } = user;
      return res.status(200).json({ message: "Login successful!", userType: "individual", user: safeUser });
    }

    db.query("SELECT * FROM facilities WHERE email = ?", [email], async (err, facilityResults) => {
      if (err) return res.status(500).json({ message: "Database error." });

      if (facilityResults.length > 0) {
        const user = facilityResults[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ message: "Incorrect password." });

        // ✅ Strip hashed password before sending to client
        const { password: _pw, ...safeUser } = user;
        return res.status(200).json({ message: "Login successful!", userType: "facility", user: safeUser });
      }

      return res.status(404).json({ message: "Email not registered." });
    });
  });
});

// ✅ Global error handler for multer and middleware errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});
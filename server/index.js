// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db'); // Import DB connection logic
const routes = require('./routes'); // Import the index file from routes folder

dotenv.config(); // Load environment variables

const app = express();

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(cors({
  origin: [
    "https://kssksg.in",
    "https://www.kssksg.in"
    "https://anexo-kss-attendance.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.options("*", cors());

// Connect to MongoDB
connectDB();

// API Routes
app.use('/api', routes); // Use the routes from index.js

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server Error', error: err.message });
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

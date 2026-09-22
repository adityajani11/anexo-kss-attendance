const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./db");
const routes = require("./routes");

dotenv.config();

const app = express();

/* =========================
   CORS
========================= */

const allowedOrigins = [
  "https://kssksg.in",
  "https://www.kssksg.in",
  "https://anexo-kss-attendance.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without an Origin header
    // (Postman, server-to-server, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  credentials: true,

  optionsSuccessStatus: 204,
};

/* =========================
   Middleware
========================= */

app.use(cors(corsOptions));

app.options("*", cors(corsOptions));

app.use(express.json());
app.use(bodyParser.json());

/* =========================
   Database
========================= */

connectDB();

/* =========================
   Health Check
========================= */

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
  });
});

/* =========================
   API Routes
========================= */

app.use("/api", routes);

/* =========================
   Error Handler
========================= */

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    message: "Server Error",
    error: err.message,
  });
});

/* =========================
   Vercel
========================= */

module.exports = app;

/* =========================
   Local Development
========================= */

if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

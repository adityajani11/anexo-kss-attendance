// routes/index.js
const express = require('express');
const router = express.Router();
const { sendAbsentMessage } = require("../controller/whatsappController");
const { sendWhatsAppOtpMessage } = require("../controller/otpController");
const authenticate = require("../middleware/auth");

// Importing specific route files
const studentRoutes = require('./StudentRoute');
const attendanceRoutes = require('./AttendanceRoute');
const adminRoutes = require('./AdminRoute');

// Mounting routes to paths
router.use('/students', studentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/admin', adminRoutes);
router.post("/send-absent-messages", authenticate, sendAbsentMessage);
router.post("/send-otp",  sendWhatsAppOtpMessage);

module.exports = router;

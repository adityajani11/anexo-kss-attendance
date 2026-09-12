const express = require("express");
const router = express.Router();
const {
  loginAdmin,
  changePassword,
  registerAdmin,
  verifyAdminPassword,
  verifyVerificationPassword,
  validateAdmin,
  changeVerificationPassword,
  changeAdminContact,
  changeAdminUsername,
  getAdminContact,
  fetchUsernameByContact,
  validateAdminByContactAndPassword
} = require("../controller/adminController");
const authenticate = require("../middleware/auth");
const { loginLimiter } = require('../middleware/rateLimiter');

// Admin login route (rate limited)
router.post("/login", loginLimiter, loginAdmin);

// Admin register route (public)
router.post("/register", registerAdmin);

// Validate Admin by contact and pasword (public)
router.post("/validate-admin-bycp", validateAdminByContactAndPassword);

// Fetch admin username by contact (public)
router.post('/fetch-username', fetchUsernameByContact);

// Change admin password route (public)
router.post("/changePassword", changePassword);

// Change verification password route (protected)
router.post("/changeVerificationPassword", authenticate, changeVerificationPassword);

// Change admin username route (protected)
router.post("/changeAdminUsername", authenticate, changeAdminUsername);

// Verify admin password route (protected)
router.post("/verifyPassword", authenticate, verifyAdminPassword);

// Verify admin verification password route (protected)
router.post("/verifyVerificationPassword", authenticate, verifyVerificationPassword);

// Change admin contact number route (protected)
router.post("/changeAdminContact", authenticate, changeAdminContact);

// Get Admin Contact Number (protected)
router.get("/get-contact", authenticate, getAdminContact);

// Validate Admin (public)
router.post("/validate", validateAdmin);

module.exports = router;

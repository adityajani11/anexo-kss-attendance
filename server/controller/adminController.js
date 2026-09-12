const Admin = require("../models/Admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Admin login [CORRECT SECURE]
exports.loginAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOne({ username: req.body.username });

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials. Please try again." });
    }

    const passwordMatch = await bcrypt.compare(req.body.password, admin.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials. Please try again." });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "2h" });

    res.status(200).json({ message: "Login successful", token, adminId: admin._id });
  } catch (error) {
    res.status(400).json({ message: "Failed to login" });
  }
};

// Change admin password
exports.changePassword = async (req, res) => {
  let { username, contact, newPassword } = req.body;

  try {
    // Convert contact to a Number if it's a string
    if (typeof contact === "string") {
      contact = Number(contact);
    }

    if (isNaN(contact)) {
      return res.status(400).json({ error: "Invalid contact number format." });
    }

    // Find the admin by ID
    const loggedInAdmin = await Admin.findOne({ username: username });

    if (!loggedInAdmin) {
      return res.status(404).json({ error: "User not found." });
    }

    // Match adminUsername and contact with the logged-in admin
    if (
      loggedInAdmin.username !== username ||
      loggedInAdmin.contact !== contact
    ) {
      return res.status(400).json({ error: "Invalid username or contact." });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    loggedInAdmin.password = hashedPassword;
    await loggedInAdmin.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
};

// Change verification password
exports.changeVerificationPassword = async (req, res) => {
  let { username, contact, newPassword } = req.body;

  const loggedInAdminId = req.user.id;

  try {
    // Convert contact to a Number if it's a string
    if (typeof contact === "string") {
      contact = Number(contact);
    }

    if (isNaN(contact)) {
      return res.status(400).json({ error: "Invalid contact number format." });
    }

    // Find the admin by ID
    const loggedInAdmin = await Admin.findById(loggedInAdminId);

    if (!loggedInAdmin) {
      return res.status(404).json({ error: "Logged-in admin not found." });
    }

    // Match adminUsername and contact with the logged-in admin
    if (
      loggedInAdmin.username !== username ||
      loggedInAdmin.contact !== contact
    ) {
      return res.status(400).json({ error: "Invalid username or contact." });
    }

    // Hash the new verification password
    const hashedVerificationPassword = await bcrypt.hash(newPassword, 10);

    // Update the verification password in the database
    loggedInAdmin.verificationPassword = hashedVerificationPassword;
    await loggedInAdmin.save();

    res.status(200).json({ message: "Verification password updated successfully." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
};

// Change admin contact number
exports.changeAdminContact = async (req, res) => {
  try {
    let { username, currentContact, newContact } = req.body;

    // Validate inputs
    if (!username || !currentContact || !newContact) {
      return res.status(400).json({
        message: "Username, current contact, and new contact number are required.",
      });
    }

    // Convert contacts to a Number if they're strings and validate
    if (typeof newContact === "string") {
      newContact = Number(newContact);
    }
    if (typeof currentContact === "string") {
      currentContact = Number(currentContact);
    }

    if (isNaN(newContact) || isNaN(currentContact)) {
      return res.status(400).json({ message: "Invalid contact number format." });
    }

    // Ensure both contacts are exactly 10-digit numbers
    const contactNumberPattern = /^\d{10}$/;
    if (!contactNumberPattern.test(newContact.toString()) || !contactNumberPattern.test(currentContact.toString())) {
      return res.status(400).json({ message: "Both contact numbers must be 10-digit numbers." });
    }

    // Check if the new contact number is the same as the current one
    if (currentContact === newContact) {
      return res.status(400).json({
        message: "The new contact number cannot be the same as the current contact number.",
      });
    }

    // Find the admin by username and check if currentContact matches the existing contact
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    if (admin.contact !== currentContact) {
      return res.status(400).json({
        message: "The current contact number provided does not match the existing contact number in the database.",
      });
    }

    // Update the contact number
    admin.contact = newContact;
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Contact number updated successfully.",
    });
  } catch (error) {
    console.error("Error updating contact number:", error);
    res.status(500).json({
      message: "Failed to update contact number. Please try again later.",
    });
  }
};

exports.changeAdminUsername =  async (req, res) => {
  const { currentUsername, contact, newUsername } = req.body;

  try {
    // Simulating an update operation in the database
    const admin = await Admin.findOneAndUpdate(
      { username: currentUsername, contact },
      { username: newUsername },
      { new: true }
    );

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Failed to update username. Invalid current details.' });
    }

    res.status(200).json({ success: true, message: 'Username updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error, please try again later.' });
  }
};

// Validate Admin
exports.validateAdmin = async (req, res) => {
  const { username, contact } = req.body;

  try {
    const admin = await Admin.findOne({ username, contact });

    if (admin) {
      return res.status(200).json({ success: true, message: "Valid credentials." });
    } else {
      return res.status(400).json({ success: false, message: "Invalid credentials." });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// Register Admin
exports.registerAdmin = async (req, res) => {
  const { username, contact, emailId, password, verificationPassword } = req.body;

  try {
    // Check if admin already exists
    const adminExists = await Admin.findOne({ username });
    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Encrypt the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Encrypt the verification password
    const hashedverificationPassword = await bcrypt.hash(verificationPassword, 10);

    // Create a new admin
    const newAdmin = new Admin({
      username,
      contact,
      emailId,
      password: hashedPassword,
      verificationPassword: hashedverificationPassword
    });

    // Save the new admin to the database
    await newAdmin.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: newAdmin._id, username: newAdmin.username },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Return the token in the response
    res.status(201).json({
      message: 'Admin registered successfully',
      token, // Include the token in the response
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// API For verifying admin password [CORRECT SECURE]
exports.verifyAdminPassword = async (req, res) => {
  try {
    const { adminId, password } = req.body;
    // Find the admin by ID using findOne to ensure proper data handling
    const admin = await Admin.findOne({ _id: adminId });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }
    res.status(200).json({ success: true, message: "Password verified" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// API For verifying admin verification password [CORRECT SECURE]
exports.verifyVerificationPassword = async (req, res) => {
  try {
    const { adminId, verificationPassword } = req.body;
    // Find the admin by ID using findOne to ensure proper data handling
    const admin = await Admin.findOne({ _id: adminId });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(verificationPassword, admin.verificationPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect verification password" });
    }
    res.status(200).json({ success: true, message: "Verification Password verified" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// API endpoint to get admin contact number
exports.getAdminContact = async (req, res) => {
  try {
    // Get the adminId from req.user (set by the authenticate middleware)
    const adminId = req.user.id; 

    // Find the admin by ID
    const admin = await Admin.findById(adminId).select('contact');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    return res.status(200).json({ success: true, contact: admin.contact });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
};

// API for validating admin by contact and password
exports.validateAdminByContactAndPassword = async (req, res) => {
  const { contact, password } = req.body;

  if (!contact || !password) {
      return res.status(400).json({ message: 'Contact number and password are required' });
  }

  try {
      // Find admin by contact number
      const admin = await Admin.findOne({ contact });

      if (!admin) {
          return res.status(404).json({ message: 'Admin with this contact number not found' });
      }

      // Compare the provided password with the stored hashed password
      const isPasswordValid = await bcrypt.compare(password, admin.password);

      if (!isPasswordValid) {
          return res.status(401).json({ message: 'Invalid password' });
      }

      // If everything is correct, return success
      res.status(200).json({ message: 'Success' });
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
  }
};

// API for fetching admin username by contact number
exports.fetchUsernameByContact = async (req, res) => {
  const { contact } = req.body; // Get contact from POST body

  if (!contact) {
      return res.status(400).json({ message: 'Contact number is required' });
  }

  try {
      const admin = await Admin.findOne({ contact });

      if (!admin) {
          return res.status(404).json({ message: 'Admin with this contact number not found' });
      }

      // Return the username if admin is found
      res.json({ username: admin.username });
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
  }
};

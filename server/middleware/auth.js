const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from the `Authorization` header

  if (!token) {
    return res.status(403).json({ success: false, message: "Unauthorized access" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id }; // Attach decoded data (e.g., `id`) to `req.user`
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token, Please login again" });
  }
};

module.exports = authenticate;

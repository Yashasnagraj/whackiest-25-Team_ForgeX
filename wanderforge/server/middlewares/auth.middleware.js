// Authentication middleware to protect routes
const requireAuth = (req, res, next) => {
  if (req.session && req.session.isAuthenticated) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized. Please login first." });
  }
};

module.exports = { requireAuth };

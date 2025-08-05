function requireAdmin(req, res, next) {
  if (req.auth?.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: "Admins only", success: false });
  }
}
module.exports = requireAdmin;
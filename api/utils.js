function requireUser(req, res, next) {
    console.log("Checking user authentication");
    if (!req.user) {
      return res.status(401).send("You must be logged in to perform this action.");
    }
    console.log("User authenticated:", req.user);
    next();
  }

module.exports = {
  requireUser
}
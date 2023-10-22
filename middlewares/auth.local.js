const checkAuthenticate = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
};

const checkNotAuthenticate = (req, res, next) => {
  if (req.isAuthenticated()) return res.redirect("/");
  next();
};

module.exports = {
  checkAuthenticate,
  checkNotAuthenticate,
};

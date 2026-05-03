const jwt = require('jsonwebtoken');
const User = require('../models/User');

const attachUser = async (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    res.locals.user = null;
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password').lean();

    if (user) {
      user.id = user._id.toString(); // ← always have both .id and ._id
    }

    req.user = user;
    res.locals.user = user;
  } catch (err) {
    res.locals.user = null;
    req.user = null;
  }

  next();
};

const requireAuth = (req, res, next) => {
  if (!req.user) return res.redirect('/login');
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  res.status(403).render('403', { title: '403 – Forbidden' });
};

module.exports = { attachUser, requireAuth, requireAdmin };

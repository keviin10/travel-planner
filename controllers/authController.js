const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const sign = (u) =>
  jwt.sign(
    { id: u._id, role: u.role, username: u.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );

const cookieOpts = {
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────

exports.getLogin = (req, res) => {
  if (res.locals.user) return res.redirect('/dashboard');
  res.render('auth/login', { title: 'Login', error: null });
};

exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.render('auth/login', {
        title: 'Login',
        error: 'Invalid email or password',
      });
    }
    res.cookie('jwt', sign(user), cookieOpts);
    res.redirect('/dashboard');
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.render('auth/login', {
      title: 'Login',
      error: 'Something went wrong. Try again.',
    });
  }
};

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────

exports.getRegister = (req, res) => {
  if (res.locals.user) return res.redirect('/dashboard');
  res.render('auth/register', { title: 'Register', error: null });
};

exports.postRegister = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Check passwords match
    if (password !== confirmPassword) {
      return res.render('auth/register', {
        title: 'Register',
        error: 'Passwords do not match',
      });
    }

    // Enforce strong password
    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!strongPassword.test(password)) {
      return res.render('auth/register', {
        title: 'Register',
        error:
          'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character (e.g. !@#$%)',
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('auth/register', {
        title: 'Register',
        error: 'Email already in use',
      });
    }

    // First user becomes admin
    const count = await User.countDocuments();
    const role = count === 0 ? 'admin' : 'user';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
    });

    res.cookie('jwt', sign(user), cookieOpts);
    res.redirect('/dashboard');
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    const msg = err.errors
      ? Object.values(err.errors)
          .map((e) => e.message)
          .join(', ')
      : err.message;
    res.render('auth/register', {
      title: 'Register',
      error: msg,
    });
  }
};

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────

exports.logout = (req, res) => {
  res.clearCookie('jwt');
  res.redirect('/');
};

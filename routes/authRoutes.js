const express = require('express');
const r = express.Router();
const c = require('../controllers/authController');

r.get('/login',     c.getLogin);
r.post('/login',    c.postLogin);
r.get('/register',  c.getRegister);
r.post('/register', c.postRegister);
r.get('/logout',    c.logout);

module.exports = r;

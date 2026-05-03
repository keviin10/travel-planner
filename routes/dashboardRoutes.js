const express = require('express');
const r = express.Router();
const c = require('../controllers/dashboardController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

r.use(requireAuth);
r.get('/',               c.getDashboard);
r.get('/users',          requireAdmin, c.getUsers);
r.delete('/users/:id',   requireAdmin, c.deleteUser);

module.exports = r;

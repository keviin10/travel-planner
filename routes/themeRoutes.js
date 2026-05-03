const express = require('express');
const r = express.Router();
const c = require('../controllers/themeController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

// IMPORTANT: specific routes before /:slug
r.get('/landing', requireAuth, c.getLanding);
r.get('/new', requireAuth, requireAdmin, c.getNew);
r.post('/', requireAuth, requireAdmin, c.create);
r.get('/:id/edit', requireAuth, requireAdmin, c.getEdit);
r.put('/:id', requireAuth, requireAdmin, c.update);
r.delete('/:id', requireAuth, requireAdmin, c.delete);
r.post('/:id/cities', requireAuth, requireAdmin, c.addCities);
r.delete('/:id/cities/:cityId', requireAuth, requireAdmin, c.removeCity);

// dynamic slug MUST be last
r.get('/', requireAuth, c.getAll);
r.get('/:slug', requireAuth, c.getOne);

module.exports = r;

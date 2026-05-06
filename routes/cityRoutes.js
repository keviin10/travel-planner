const express = require('express');
const r = express.Router();
const c = require('../controllers/cityController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

r.use(requireAuth);
r.get('/', c.getAll);
r.get('/new', requireAdmin, c.getNew);
r.post('/', requireAdmin, c.create);
r.get('/:id', c.getOne);
r.get('/:id/edit', requireAdmin, c.getEdit);
r.put('/:id', requireAdmin, c.update);
r.delete('/:id', requireAdmin, c.delete);

r.post('/:id/bucket', c.toggleBucket);
module.exports = r;

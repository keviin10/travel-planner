const express = require('express');
const r = express.Router();
const c = require('../controllers/tripController');
const { requireAuth } = require('../middleware/authMiddleware');

r.use(requireAuth);
r.get('/',     c.getAll);
r.get('/new',  c.getNew);
r.post('/',    c.create);
r.get('/:id',       c.getOne);
r.get('/:id/edit',  c.getEdit);
r.put('/:id',       c.update);
r.delete('/:id',    c.delete);

// Many-to-many: cities on a trip
r.post('/:id/cities',              c.addCity);
r.delete('/:id/cities/:cityId',    c.removeCity);

// Activity sub-documents (one-to-many embedded)
r.post('/:id/activities',          c.addActivity);
r.delete('/:id/activities/:actId', c.removeActivity);

module.exports = r;

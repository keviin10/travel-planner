const Country = require('../models/Country');
const City = require('../models/City');

// GET /countries
exports.getAll = async (req, res) => {
  const { search } = req.query;
  let filter = {};
  if (search)
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
  const countries = await Country.find(filter).sort({ name: 1 }).lean();
  res.render('countries/index', {
    title: 'Countries',
    activePage: 'countries',
    user: res.locals.user,
    countries,
    search,
  });
};

// GET /countries/new
exports.getNew = (req, res) => {
  res.render('countries/new', {
    title: 'New Country',
    activePage: 'countries',
    user: res.locals.user,
    error: null,
  });
};

// POST /countries
exports.create = async (req, res) => {
  try {
    await Country.create(req.body);
    res.redirect('/countries');
  } catch (err) {
    const msg = err.errors
      ? Object.values(err.errors)
          .map((e) => e.message)
          .join(', ')
      : 'Failed to create country';
    res.render('countries/new', {
      title: 'New Country',
      activePage: 'countries',
      user: res.locals.user,
      error: msg,
    });
  }
};

// GET /countries/:id
exports.getOne = async (req, res) => {
  try {
    const country = await Country.findById(req.params.id).lean();
    if (!country) return res.redirect('/countries');
    const cities = await City.find({ country: req.params.id })
      .sort({ name: 1 })
      .lean();
    res.render('countries/show', {
      title: country.name,
      activePage: 'countries',
      user: res.locals.user,
      country,
      cities,
    });
  } catch {
    res.redirect('/countries');
  }
};

// GET /countries/:id/edit
exports.getEdit = async (req, res) => {
  try {
    const country = await Country.findById(req.params.id).lean();
    if (!country) return res.redirect('/countries');
    res.render('countries/edit', {
      title: 'Edit Country',
      activePage: 'countries',
      user: res.locals.user,
      country,
      error: null,
    });
  } catch {
    res.redirect('/countries');
  }
};

// PUT /countries/:id
exports.update = async (req, res) => {
  try {
    await Country.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
    });
    res.redirect(`/countries/${req.params.id}`);
  } catch (err) {
    const country = await Country.findById(req.params.id).lean();
    const msg = err.errors
      ? Object.values(err.errors)
          .map((e) => e.message)
          .join(', ')
      : 'Failed to update';
    res.render('countries/edit', {
      title: 'Edit Country',
      activePage: 'countries',
      user: res.locals.user,
      country,
      error: msg,
    });
  }
};

// DELETE /countries/:id
exports.delete = async (req, res) => {
  try {
    const cityCount = await City.countDocuments({ country: req.params.id });
    if (cityCount > 0) {
      const country = await Country.findById(req.params.id).lean();
      const cities = await City.find({ country: req.params.id }).lean();
      return res.render('countries/show', {
        title: country.name,
        activePage: 'countries',
        user: res.locals.user,
        country,
        cities,
        error: `Cannot delete — ${cityCount} city/cities belong to this country.`,
      });
    }
    await Country.findByIdAndDelete(req.params.id);
    res.redirect('/countries');
  } catch {
    res.redirect('/countries');
  }
};

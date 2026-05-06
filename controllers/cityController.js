const City = require('../models/City');
const Country = require('../models/Country');
const User = require('../models/User');

exports.getAll = async (req, res) => {
  const { country, search } = req.query;
  let filter = {};
  if (country) filter.country = country;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const [cities, countries] = await Promise.all([
    City.find(filter).populate('country', 'name').sort({ name: 1 }).lean(),
    Country.find().sort({ name: 1 }).lean(),
  ]);

  const me = await User.findById(req.user.id).select('bucketList').lean();
  const bucketIds = (me?.bucketList || []).map((id) => id.toString());

  res.render('cities/index', {
    title: 'Cities',
    activePage: 'cities',
    user: res.locals.user,
    cities,
    countries,
    country,
    search,
    bucketIds,
  });
};

exports.getNew = async (req, res) => {
  const countries = await Country.find().sort({ name: 1 }).lean();
  res.render('cities/new', {
    title: 'New City',
    activePage: 'cities',
    user: res.locals.user,
    countries,
    error: null,
  });
};

exports.create = async (req, res) => {
  try {
    await City.create(req.body);
    res.redirect('/cities');
  } catch (err) {
    const countries = await Country.find().sort({ name: 1 }).lean();
    const msg = err.errors
      ? Object.values(err.errors)
          .map((e) => e.message)
          .join(', ')
      : 'Failed to create city';
    res.render('cities/new', {
      title: 'New City',
      activePage: 'cities',
      user: res.locals.user,
      countries,
      error: msg,
    });
  }
};

exports.getOne = async (req, res) => {
  try {
    const city = await City.findById(req.params.id)
      .populate('country', 'name code')
      .populate('visitors', 'username')
      .lean();
    if (!city) return res.redirect('/cities');

    const me = await User.findById(req.user.id).select('bucketList').lean();
    const inBucket = (me?.bucketList || [])
      .map((id) => id.toString())
      .includes(req.params.id);

    res.render('cities/show', {
      title: city.name,
      activePage: 'cities',
      user: res.locals.user,
      city,
      inBucket,
    });
  } catch {
    res.redirect('/cities');
  }
};

exports.getEdit = async (req, res) => {
  try {
    const [city, countries] = await Promise.all([
      City.findById(req.params.id).lean(),
      Country.find().sort({ name: 1 }).lean(),
    ]);
    if (!city) return res.redirect('/cities');
    res.render('cities/edit', {
      title: 'Edit City',
      activePage: 'cities',
      user: res.locals.user,
      city,
      countries,
      error: null,
    });
  } catch {
    res.redirect('/cities');
  }
};

exports.update = async (req, res) => {
  try {
    await City.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
    });
    res.redirect(`/cities/${req.params.id}`);
  } catch (err) {
    const [city, countries] = await Promise.all([
      City.findById(req.params.id).lean(),
      Country.find().sort({ name: 1 }).lean(),
    ]);
    const msg = err.errors
      ? Object.values(err.errors)
          .map((e) => e.message)
          .join(', ')
      : 'Failed to update';
    res.render('cities/edit', {
      title: 'Edit City',
      activePage: 'cities',
      user: res.locals.user,
      city,
      countries,
      error: msg,
    });
  }
};

exports.delete = async (req, res) => {
  try {
    await City.findByIdAndDelete(req.params.id);
    await User.updateMany(
      { bucketList: req.params.id },
      { $pull: { bucketList: req.params.id } },
    );
    res.redirect('/cities');
  } catch {
    res.redirect('/cities');
  }
};

exports.toggleBucket = async (req, res) => {
  try {
    const uid = req.user.id;
    const cityId = req.params.id;

    // Check if city exists
    const city = await City.findById(cityId);
    if (!city) {
      return res.redirect('/cities');
    }

    const me = await User.findById(uid).select('bucketList').lean();
    const inList = (me?.bucketList || [])
      .map((id) => id.toString())
      .includes(cityId);

    if (inList) {
      // Remove from bucket list
      await User.findByIdAndUpdate(uid, { $pull: { bucketList: cityId } });
      await City.findByIdAndUpdate(cityId, { $pull: { visitors: uid } });
    } else {
      // Add to bucket list
      await User.findByIdAndUpdate(uid, { $addToSet: { bucketList: cityId } });
      await City.findByIdAndUpdate(cityId, { $addToSet: { visitors: uid } });
    }

    // Redirect back to the same page
    res.redirect(`/cities/${cityId}`);
  } catch (err) {
    console.error('Bucket toggle error:', err);
    res.redirect(`/cities/${req.params.id}`);
  }
};

const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const City = require('../models/City');
const User = require('../models/User');

const STATUSES = ['planned', 'ongoing', 'completed', 'cancelled'];

const isOwnerOrAdmin = (trip, user) => {
  return (
    trip.user.toString() === (user._id || user.id).toString() ||
    user.role === 'admin'
  );
};

// GET /trips
exports.getAll = async (req, res) => {
  try {
    const { status, search } = req.query;
    const uid = req.user._id || req.user.id;

    let filter;

    if (req.user.role === 'admin') {
      // admin sees all trips
      filter = {};
    } else {
      // user sees their own trips + public trips from others
      filter = {
        $or: [{ user: uid }, { isPublic: true }],
      };
    }

    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const trips = await Trip.find(filter)
      .populate('cities', 'name')
      .populate('user', 'username')
      .sort({ startDate: -1 })
      .lean();

    res.render('trips/index', {
      title: 'My Trips',
      activePage: 'trips',
      user: res.locals.user,
      trips,
      status,
      search,
      statuses: STATUSES,
    });
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
};

// GET /trips/new
exports.getNew = async (req, res) => {
  const cities = await City.find()
    .sort({ name: 1 })
    .populate('country', 'name')
    .lean();
  res.render('trips/new', {
    title: 'New Trip',
    activePage: 'trips',
    user: res.locals.user,
    cities,
    error: null,
    statuses: STATUSES,
  });
};

// POST /trips
exports.create = async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      budget,
      status,
      isPublic,
      tags,
      cities,
    } = req.body;
    const cityIds = Array.isArray(cities) ? cities : cities ? [cities] : [];
    const uid = req.user._id || req.user.id;

    const trip = await Trip.create({
      name,
      description,
      startDate,
      endDate,
      budget: budget || undefined,
      status: status || 'planned',
      isPublic: isPublic === 'on',
      tags: tags
        ? tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      cities: cityIds,
      user: uid,
    });

    await City.updateMany(
      { _id: { $in: cityIds } },
      { $addToSet: { trips: trip._id } },
    );
    await User.findByIdAndUpdate(uid, {
      $addToSet: { trips: trip._id },
    });

    res.redirect(`/trips/${trip._id}`);
  } catch (err) {
    const cities = await City.find()
      .sort({ name: 1 })
      .populate('country', 'name')
      .lean();
    const msg = err.errors
      ? Object.values(err.errors)
          .map((e) => e.message)
          .join(', ')
      : 'Failed to create trip';
    res.render('trips/new', {
      title: 'New Trip',
      activePage: 'trips',
      user: res.locals.user,
      cities,
      error: msg,
      statuses: STATUSES,
    });
  }
};

// GET /trips/:id
exports.getOne = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate({
        path: 'cities',
        populate: { path: 'country', select: 'name' },
      })
      .populate('user', 'username')
      .lean();
    if (!trip) return res.redirect('/trips');

    const tripCityIds = trip.cities.map((c) => c._id.toString());
    const availableCities = await City.find({ _id: { $nin: tripCityIds } })
      .sort({ name: 1 })
      .populate('country', 'name')
      .lean();

    res.render('trips/show', {
      title: trip.name,
      activePage: 'trips',
      user: res.locals.user,
      trip,
      availableCities,
    });
  } catch {
    res.redirect('/trips');
  }
};

// GET /trips/:id/edit
exports.getEdit = async (req, res) => {
  try {
    const [trip, cities] = await Promise.all([
      Trip.findById(req.params.id).lean(),
      City.find().sort({ name: 1 }).populate('country', 'name').lean(),
    ]);
    if (!trip) return res.redirect('/trips');

    if (!isOwnerOrAdmin(trip, req.user)) return res.redirect('/trips');

    res.render('trips/edit', {
      title: 'Edit Trip',
      activePage: 'trips',
      user: res.locals.user,
      trip,
      cities,
      error: null,
      statuses: STATUSES,
    });
  } catch {
    res.redirect('/trips');
  }
};

// PUT /trips/:id
exports.update = async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      budget,
      status,
      isPublic,
      tags,
      cities,
    } = req.body;
    const cityIds = Array.isArray(cities) ? cities : cities ? [cities] : [];

    const oldTrip = await Trip.findById(req.params.id);
    if (!oldTrip) return res.redirect('/trips');

    if (!isOwnerOrAdmin(oldTrip, req.user)) return res.redirect('/trips');

    const oldCityIds = oldTrip.cities.map((c) => c.toString());

    await Trip.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        startDate,
        endDate,
        budget: budget || undefined,
        status,
        isPublic: isPublic === 'on',
        tags: tags
          ? tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        cities: cityIds,
      },
      { runValidators: true },
    );

    const removed = oldCityIds.filter((id) => !cityIds.includes(id));
    const added = cityIds.filter((id) => !oldCityIds.includes(id));
    if (removed.length)
      await City.updateMany(
        { _id: { $in: removed } },
        { $pull: { trips: req.params.id } },
      );
    if (added.length)
      await City.updateMany(
        { _id: { $in: added } },
        { $addToSet: { trips: req.params.id } },
      );

    res.redirect(`/trips/${req.params.id}`);
  } catch (err) {
    const [trip, cities] = await Promise.all([
      Trip.findById(req.params.id).lean(),
      City.find().sort({ name: 1 }).populate('country', 'name').lean(),
    ]);
    const msg = err.errors
      ? Object.values(err.errors)
          .map((e) => e.message)
          .join(', ')
      : 'Failed to update trip';
    res.render('trips/edit', {
      title: 'Edit Trip',
      activePage: 'trips',
      user: res.locals.user,
      trip,
      cities,
      error: msg,
      statuses: STATUSES,
    });
  }
};

// DELETE /trips/:id
exports.delete = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.redirect('/trips');

    if (!isOwnerOrAdmin(trip, req.user)) return res.redirect('/trips');

    await City.updateMany({ trips: trip._id }, { $pull: { trips: trip._id } });
    await User.findByIdAndUpdate(trip.user, { $pull: { trips: trip._id } });
    await trip.deleteOne();

    res.redirect('/trips');
  } catch {
    res.redirect('/trips');
  }
};

// POST /trips/:id/cities
exports.addCity = async (req, res) => {
  try {
    const { cityId } = req.body;
    await Trip.findByIdAndUpdate(req.params.id, {
      $addToSet: { cities: cityId },
    });
    await City.findByIdAndUpdate(cityId, {
      $addToSet: { trips: req.params.id },
    });
    res.redirect(`/trips/${req.params.id}`);
  } catch {
    res.redirect(`/trips/${req.params.id}`);
  }
};

// DELETE /trips/:id/cities/:cityId
exports.removeCity = async (req, res) => {
  try {
    await Trip.findByIdAndUpdate(req.params.id, {
      $pull: { cities: req.params.cityId },
    });
    await City.findByIdAndUpdate(req.params.cityId, {
      $pull: { trips: req.params.id },
    });
    res.redirect(`/trips/${req.params.id}`);
  } catch {
    res.redirect(`/trips/${req.params.id}`);
  }
};

// POST /trips/:id/activities
exports.addActivity = async (req, res) => {
  try {
    const { name, date, time, cost, notes } = req.body;
    await Trip.findByIdAndUpdate(req.params.id, {
      $push: {
        activities: {
          name,
          date: date || undefined,
          time,
          cost: cost || undefined,
          notes,
        },
      },
    });
    res.redirect(`/trips/${req.params.id}`);
  } catch {
    res.redirect(`/trips/${req.params.id}`);
  }
};

// DELETE /trips/:id/activities/:actId
exports.removeActivity = async (req, res) => {
  try {
    await Trip.findByIdAndUpdate(req.params.id, {
      $pull: { activities: { _id: req.params.actId } },
    });
    res.redirect(`/trips/${req.params.id}`);
  } catch {
    res.redirect(`/trips/${req.params.id}`);
  }
};

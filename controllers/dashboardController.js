const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const City = require('../models/City');
const Country = require('../models/Country');
const User = require('../models/User');

exports.getDashboard = async (req, res) => {
  try {
    if (!req.user) return res.redirect('/login');

    const uid = req.user._id || req.user.id;

    const [totalTrips, totalCities, totalCountries, myTrips, popularCities] =
      await Promise.all([
        Trip.countDocuments({ user: uid }),
        City.countDocuments(),
        Country.countDocuments(),
        Trip.find({ user: uid })
          .sort({ startDate: -1 })
          .limit(5)
          .populate('cities', 'name')
          .lean(),
        City.find().limit(5).populate('country', 'name').lean(),
      ]);

    const statusBreakdown = await Trip.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(uid) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const bucketUser = await User.findById(uid)
      .populate('bucketList', 'name')
      .lean();

    const bucketCount = bucketUser?.bucketList?.length || 0;

    let totalUsers = null;
    if (req.user.role === 'admin') {
      totalUsers = await User.countDocuments();
    }

    return res.render('dashboard/index', {
      title: 'Dashboard',
      activePage: 'dashboard',
      user: req.user, // ✅ FIXED (NO res.locals dependency)
      totalTrips,
      totalCities,
      totalCountries,
      bucketCount,
      myTrips,
      popularCities,
      statusBreakdown,
      totalUsers,
    });
  } catch (err) {
    console.error(err);

    return res.render('dashboard/index', {
      title: 'Dashboard',
      activePage: 'dashboard',
      user: req.user || null,
      totalTrips: 0,
      totalCities: 0,
      totalCountries: 0,
      bucketCount: 0,
      myTrips: [],
      popularCities: [],
      statusBreakdown: [],
      totalUsers: null,
    });
  }
};

exports.getUsers = async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).lean();

  res.render('dashboard/users', {
    title: 'Manage Users',
    activePage: 'dashboard',
    user: req.user,
    users,
  });
};

exports.deleteUser = async (req, res) => {
  if (req.params.id !== req.user.id) {
    await User.findByIdAndDelete(req.params.id);
  }

  res.redirect('/dashboard/users');
};

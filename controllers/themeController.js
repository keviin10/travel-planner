const Theme = require('../models/Theme');
const City = require('../models/City');
const User = require('../models/User');

// GET /themes/landing
exports.getLanding = (req, res) => {
  res.render('themes/landing', {
    title: 'Travel Themes',
    activePage: 'themes',
    user: res.locals.user || null,
  });
};

// GET /themes
exports.getAll = async (req, res) => {
  try {
    const themes = await Theme.find().sort({ createdAt: -1 }).lean();
    res.render('themes/index', {
      title: 'All Themes',
      activePage: 'themes',
      user: res.locals.user || null,
      themes,
    });
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
};

// GET /themes/new
exports.getNew = (req, res) => {
  res.render('themes/new', {
    title: 'New Theme',
    activePage: 'themes',
    user: res.locals.user,
    error: null,
  });
};

// POST /themes
exports.create = async (req, res) => {
  try {
    const { name, title, subtitle, description, image, isActive } = req.body;

    const existing = await Theme.findOne({ name });
    if (existing) {
      return res.render('themes/new', {
        title: 'New Theme',
        activePage: 'themes',
        user: res.locals.user,
        error: `A "${name}" theme already exists. You can edit it or add cities from its page.`,
      });
    }

    const theme = new Theme({
      name,
      title,
      subtitle,
      description,
      image: image || '/assets/default-theme.jpg',
      cities: [],
      isActive: isActive === 'on',
    });
    await theme.save();

    res.redirect(`/themes/${theme.slug}`);
  } catch (err) {
    console.error(err);
    const msg =
      err.code === 11000
        ? 'A theme with this title already exists.'
        : err.errors
          ? Object.values(err.errors)
              .map((e) => e.message)
              .join(', ')
          : 'Failed to create theme';
    res.render('themes/new', {
      title: 'New Theme',
      activePage: 'themes',
      user: res.locals.user,
      error: msg,
    });
  }
};

// GET /themes/:id/edit
exports.getEdit = async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id).lean();
    if (!theme) return res.redirect('/themes/landing');
    res.render('themes/edit', {
      title: 'Edit Theme',
      activePage: 'themes',
      user: res.locals.user,
      theme,
      error: null,
    });
  } catch (err) {
    console.error(err);
    res.redirect('/themes/landing');
  }
};

// PUT /themes/:id
exports.update = async (req, res) => {
  try {
    const { name, title, subtitle, description, image, isActive } = req.body;

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    await Theme.findByIdAndUpdate(
      req.params.id,
      {
        name,
        title,
        subtitle,
        description,
        image: image || '/assets/default-theme.jpg',
        isActive: isActive === 'on',
        slug,
      },
      { runValidators: true },
    );

    res.redirect(`/themes/${slug}`);
  } catch (err) {
    console.error(err);
    const theme = await Theme.findById(req.params.id).lean();
    const msg =
      err.code === 11000
        ? 'A theme with this title already exists.'
        : err.errors
          ? Object.values(err.errors)
              .map((e) => e.message)
              .join(', ')
          : 'Failed to update theme';
    res.render('themes/edit', {
      title: 'Edit Theme',
      activePage: 'themes',
      user: res.locals.user,
      theme,
      error: msg,
    });
  }
};

// DELETE /themes/:id
exports.delete = async (req, res) => {
  try {
    await Theme.findByIdAndDelete(req.params.id);
    res.redirect('/themes/landing');
  } catch (err) {
    console.error(err);
    res.redirect('/themes/landing');
  }
};

// GET /themes/:slug
exports.getOne = async (req, res) => {
  try {
    const populate = {
      path: 'cities',
      populate: { path: 'country', select: 'name code' },
    };

    // 1. try by slug
    let theme = await Theme.findOne({ slug: req.params.slug })
      .populate(populate)
      .lean();

    // 2. fall back: convert slug → name  (civil-marriage → Civil Marriage)
    if (!theme) {
      const nameFromSlug = req.params.slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      theme = await Theme.findOne({ name: nameFromSlug })
        .populate(populate)
        .lean();
    }

    // 3. not found → show friendly page
    if (!theme) {
      return res.render('themes/not-found', {
        title: 'Theme Not Found',
        activePage: 'themes',
        user: res.locals.user || null,
        slug: req.params.slug,
      });
    }

    // cities not yet in this theme
    const themeCityIds = theme.cities.map((c) => c._id.toString());
    const availableCities = await City.find({ _id: { $nin: themeCityIds } })
      .sort({ name: 1 })
      .populate('country', 'name')
      .lean();

    let bucketIds = [];
    if (req.user) {
      const me = await User.findById(req.user._id || req.user.id)
        .select('bucketList')
        .lean();
      bucketIds = (me?.bucketList || []).map((id) => id.toString());
    }

    res.render('themes/show', {
      title: theme.title,
      activePage: 'themes',
      user: res.locals.user || null,
      theme,
      availableCities,
      bucketIds,
    });
  } catch (err) {
    console.error(err);
    res.redirect('/themes/landing');
  }
};

// POST /themes/:id/cities
exports.addCities = async (req, res) => {
  try {
    const cityIds = Array.isArray(req.body.cities)
      ? req.body.cities
      : req.body.cities
        ? [req.body.cities]
        : [];

    if (!cityIds.length) return res.redirect('back');

    const theme = await Theme.findById(req.params.id);
    if (!theme) return res.redirect('/themes/landing');

    await Theme.findByIdAndUpdate(req.params.id, {
      $addToSet: { cities: { $each: cityIds } },
    });

    res.redirect(`/themes/${theme.slug}`);
  } catch (err) {
    console.error(err);
    res.redirect('/themes/landing');
  }
};

// DELETE /themes/:id/cities/:cityId
exports.removeCity = async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id);
    if (!theme) return res.redirect('/themes/landing');

    await Theme.findByIdAndUpdate(req.params.id, {
      $pull: { cities: req.params.cityId },
    });

    res.redirect(`/themes/${theme.slug}`);
  } catch (err) {
    console.error(err);
    res.redirect('/themes/landing');
  }
};

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const path = require('path');

const { attachUser } = require('./middleware/authMiddleware');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const tripRoutes = require('./routes/tripRoutes');
const cityRoutes = require('./routes/cityRoutes');
const countryRoutes = require('./routes/countryRoutes');
const themeRoutes = require('./routes/themeRoutes');

const app = express();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB:', err);
    process.exit(1);
  });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(attachUser);

app.get('/', (req, res) => {
  res.render('home', {
    title: 'TravelPlanner - Plan Your Next Adventure',
    user: res.locals.user || null,
  });
});

app.get('/about', (req, res) => {
  res.render('about', {
    title: 'About Us | TravelPlanner',
    user: res.locals.user || null,
  });
});

app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/trips', tripRoutes);
app.use('/cities', cityRoutes);
app.use('/countries', countryRoutes);
app.use('/themes', themeRoutes);

app.use((req, res) =>
  res.status(404).render('404', { title: '404 – Not Found' }),
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));

const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({ 
  name: { type: String, required: true },
  code: { type: String, maxlength: 3 },
  image: { type: String, default: '/assets/default-country.jpg' }, // Image URL field
});

module.exports = mongoose.model('Country', countrySchema);
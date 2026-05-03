const mongoose = require('mongoose');

const citySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Country',
      required: true,
    },
    visitors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Many-to-Many: Trips relationship
    trips: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trip' }],
    // Additional city info
    population: { type: Number },
    timezone: { type: String },
    language: { type: String },
    currency: { type: String },
    image: { type: String, default: '/assets/default-city.jpg' }, // ← URL instead of Base64
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('City', citySchema);
const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date },
  time: { type: String },
  cost: { type: Number },
  notes: { type: String }
});

const tripSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  budget: { type: Number },
  status: { 
    type: String, 
    enum: ['planned', 'ongoing', 'completed', 'cancelled'],
    default: 'planned'
  },
  // One-to-Many: User relationship
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  // Many-to-Many: Cities relationship
  cities: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'City' 
  }],
  // One-to-Many: Activities (embedded sub-documents)
  activities: [activitySchema],
  // Additional metadata
  tags: [{ type: String }],
  isPublic: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Virtual field to calculate trip duration
tripSchema.virtual('duration').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  const diffTime = Math.abs(this.endDate - this.startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Ensure virtuals are included in JSON output
tripSchema.set('toJSON', { virtuals: true });
tripSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Trip', tripSchema);
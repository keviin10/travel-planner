const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ['Civil Marriage', 'Honeymoon', 'Girls Trip', 'Festival Escapes'],
    },
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, default: '/assets/default-theme.jpg' },
    slug: { type: String, unique: true },
    cities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'City' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

themeSchema.pre('save', function (next) {
  if (this.title && (!this.slug || this.isModified('title'))) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Theme', themeSchema);

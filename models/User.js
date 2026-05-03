const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },

    bucketList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'City' }],

    trips: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trip' }],

    password: {
      type: String,
      required: true,
      minlength: [8, 'Password must be at least 8 characters'],
    },

    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
  },
  { timestamps: true },
);

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ['student', 'staff', 'admin', 'superadmin'],
      default: 'student',
    },
    institute: {
      type: String,
      required: true,
      default: 'BPUT Tech Campus',
      trim: true,
      index: true,
    },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institute',
      default: null,
    },
    department: {
      type: String,
      default: 'Campus Community',
    },
    identifier: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    googleId: {
      type: String,
      default: null,
    },
    lastActiveLocation: {
      latitude: Number,
      longitude: Number,
      updatedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);

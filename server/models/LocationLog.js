const mongoose = require('mongoose');

const locationLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    userName: {
      type: String,
      default: 'Campus User',
    },
    userRole: {
      type: String,
      enum: ['student', 'staff', 'admin'],
      default: 'student',
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    speed: {
      type: Number,
      default: 0,
    },
    heading: {
      type: Number,
      default: 0,
    },
    altitude: {
      type: Number,
      default: 0,
    },
    campusZone: {
      type: String,
      default: 'GIFT Autonomous Campus',
    },
    batteryLevel: {
      type: Number,
      default: null,
    },
    loggedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

locationLogSchema.index({ loggedAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('LocationLog', locationLogSchema);

const mongoose = require('mongoose');

const instituteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    location: {
      type: String,
      default: 'Campus Area',
      trim: true,
    },
    city: {
      type: String,
      default: 'Bhubaneswar',
      trim: true,
    },
    state: {
      type: String,
      default: 'Odisha',
      trim: true,
    },
    contactEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    zones: [
      {
        name: { type: String, required: true },
        building: { type: String, required: true },
        room: { type: String, default: '' },
        category: { type: String, default: 'Damaged Infrastructure' },
        recommendation: { type: String, default: '' },
        lat: { type: Number, default: 20.2195 },
        lng: { type: Number, default: 85.7360 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Institute', instituteSchema);

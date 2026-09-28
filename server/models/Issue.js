const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Damaged Infrastructure',
        'Electrical & Lighting',
        'Water Leakage & Plumbing',
        'Cleanliness & Sanitation',
        'Network & Wi-Fi',
        'Lab & Classroom Equipment',
        'Safety & Security Hazard',
        'Other',
      ],
      default: 'Damaged Infrastructure',
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    priorityScore: {
      type: Number,
      default: 50,
    },
    status: {
      type: String,
      enum: ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
      default: 'Submitted',
    },
    location: {
      building: {
        type: String,
        required: true,
        default: 'Main Academic Block',
      },
      room: {
        type: String,
        default: '',
      },
      landmark: {
        type: String,
        default: '',
      },
      latitude: {
        type: Number,
        default: 20.2195,
      },
      longitude: {
        type: Number,
        default: 85.7360,
      },
      qrCodeTag: {
        type: String,
        default: '',
      },
    },
    media: {
      url: {
        type: String,
        default: '',
      },
      publicId: {
        type: String,
        default: '',
      },
      provider: {
        type: String,
        default: 'cloudinary',
      },
      mediaType: {
        type: String,
        enum: ['image', 'video', 'none'],
        default: 'image',
      },
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    institute: {
      type: String,
      default: 'BPUT Tech Campus',
      trim: true,
      index: true,
    },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institute',
      default: null,
    },
    reportedByName: {
      type: String,
      default: 'Campus Resident',
    },
    reportedByEmail: {
      type: String,
      default: '',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedToName: {
      type: String,
      default: 'Unassigned',
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    upvotesCount: {
      type: Number,
      default: 0,
    },
    isDuplicate: {
      type: Boolean,
      default: false,
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      default: null,
    },
    resolutionDetails: {
      resolvedAt: {
        type: Date,
        default: null,
      },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      resolvedByName: {
        type: String,
        default: '',
      },
      resolutionNotes: {
        type: String,
        default: '',
      },
      resolutionMediaUrl: {
        type: String,
        default: '',
      },
      resolutionMediaType: {
        type: String,
        enum: ['image', 'video', 'none'],
        default: 'image',
      },
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: String, default: 'System' },
        remarks: { type: String, default: '' },
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        userName: { type: String, default: 'Campus Resident' },
        userRole: { type: String, default: 'student' },
        userAvatar: { type: String, default: '' },
        text: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

issueSchema.virtual('imageUrl').get(function () {
  return this.media?.url || '';
});

issueSchema.virtual('resolutionProofUrl').get(function () {
  return this.resolutionDetails?.resolutionMediaUrl || '';
});

issueSchema.virtual('resolutionMediaType').get(function () {
  return this.resolutionDetails?.resolutionMediaType || 'image';
});

issueSchema.virtual('resolutionNotes').get(function () {
  return this.resolutionDetails?.resolutionNotes || '';
});

issueSchema.pre('save', function (next) {
  let baseScore = 40;
  if (this.severity === 'Critical') baseScore = 90;
  else if (this.severity === 'High') baseScore = 70;
  else if (this.severity === 'Medium') baseScore = 50;
  else if (this.severity === 'Low') baseScore = 25;

  const upvoteBonus = Math.min((this.upvotesCount || 0) * 5, 20);
  this.priorityScore = Math.min(baseScore + upvoteBonus, 100);
  next();
});

module.exports = mongoose.model('Issue', issueSchema);

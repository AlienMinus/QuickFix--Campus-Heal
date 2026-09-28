const User = require('../models/User');
const Issue = require('../models/Issue');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const seedInitialData = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('ℹ️ Skipping seed data: MongoDB connection not ready.');
      return;
    }
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return;
    }

    console.log('🌱 Seeding initial campus data for BPUT Tech Carnival 2026 (GIFT Autonomous)...');

    const salt = await bcrypt.genSalt(10);
    const demoPassword = await bcrypt.hash('quickfix2026', salt);

    const adminUser = await User.create({
      name: 'Prof. S. K. Patnaik',
      email: 'admin.campus@gift.ac.in',
      password: demoPassword,
      role: 'admin',
      department: 'Central Campus Administration',
      identifier: 'ADMIN-001',
      phone: '+91 94370 12345',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    });

    const staffUser = await User.create({
      name: 'Bikash Mohapatra',
      email: 'maintenance.staff@gift.ac.in',
      password: demoPassword,
      role: 'staff',
      department: 'Electrical & Facilities Maintenance',
      identifier: 'STAFF-EM-108',
      phone: '+91 98610 54321',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    });

    const studentUser = await User.create({
      name: 'Rohan Sharma',
      email: 'student.demo@gift.ac.in',
      password: demoPassword,
      role: 'student',
      department: 'Computer Science & Engineering',
      identifier: 'GIFT-2022-CSE-042',
      phone: '+91 70081 99887',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
    });

    const sampleIssues = [
      {
        title: 'Broken Floodlight & Low Illumination',
        description: 'Two floodlight panels on the pathway between Main Academic Block and Central Library are completely off, posing safety concerns for evening students.',
        category: 'Electrical & Lighting',
        severity: 'High',
        priorityScore: 75,
        status: 'In Progress',
        location: {
          building: 'Central Library Walkway',
          room: 'Pole #L-09',
          landmark: 'Opposite Library East Entry',
          latitude: 20.2193,
          longitude: 85.7359,
          qrCodeTag: 'GIFT-LIB-POLE-09',
        },
        media: {
          url: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=800&q=80',
          provider: 'cloudinary',
        },
        reportedBy: studentUser._id,
        reportedByName: studentUser.name,
        reportedByEmail: studentUser.email,
        assignedTo: staffUser._id,
        assignedToName: staffUser.name,
        upvotesCount: 8,
        statusHistory: [
          { status: 'Submitted', changedAt: new Date(Date.now() - 3600000 * 5), changedBy: 'Rohan Sharma', remarks: 'Reported via Mobile App' },
          { status: 'In Progress', changedAt: new Date(Date.now() - 3600000 * 2), changedBy: 'Prof. S. K. Patnaik', remarks: 'Assigned to Bikash Mohapatra for ballast replacement' },
        ],
      },
      {
        title: 'Water Pipe Leakage Flooding Washroom',
        description: 'Continuous high pressure leakage under sink counter causing water stagnation on floor.',
        category: 'Water Leakage & Plumbing',
        severity: 'Critical',
        priorityScore: 95,
        status: 'Submitted',
        location: {
          building: 'Main Academic Block (MAB)',
          room: 'Ground Floor Restroom (West Wing)',
          landmark: 'Beside Staircase B',
          latitude: 20.2196,
          longitude: 85.7361,
          qrCodeTag: 'GIFT-MAB-GF-WASH-02',
        },
        media: {
          url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
          provider: 'cloudinary',
        },
        reportedBy: studentUser._id,
        reportedByName: studentUser.name,
        reportedByEmail: studentUser.email,
        upvotesCount: 14,
        statusHistory: [
          { status: 'Submitted', changedAt: new Date(Date.now() - 3600000 * 3), changedBy: 'Rohan Sharma', remarks: 'Critical leak flagged' },
        ],
      },
      {
        title: 'Damaged Staircase Granite Edge',
        description: 'Chipped edge on 3rd floor staircase posing tripping risk during class transitions.',
        category: 'Damaged Infrastructure',
        severity: 'Medium',
        priorityScore: 55,
        status: 'Submitted',
        location: {
          building: 'Main Academic Block (MAB)',
          room: 'Staircase 2, Floor 3',
          landmark: 'Near Room 304',
          latitude: 20.2195,
          longitude: 85.7362,
          qrCodeTag: 'GIFT-MAB-F3-STAIR-2',
        },
        media: {
          url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80',
          provider: 'cloudinary',
        },
        reportedByName: 'Priya Nayak (Student)',
        reportedByEmail: 'priya.n@gift.ac.in',
        upvotesCount: 3,
        statusHistory: [
          { status: 'Submitted', changedAt: new Date(Date.now() - 3600000 * 8), changedBy: 'Priya Nayak', remarks: 'Reported' },
        ],
      },
      {
        title: 'Lab 4 High-Speed Wi-Fi AP Dropping Packets',
        description: 'Ubiquiti Access Point in Lab 4 keeps disconnecting students during database and networking sessions.',
        category: 'Network & Wi-Fi',
        severity: 'High',
        priorityScore: 72,
        status: 'In Progress',
        location: {
          building: 'Engineering & Computing Labs',
          room: 'Lab 4 (Cloud & Systems)',
          landmark: 'Rack AP-4B',
          latitude: 20.2198,
          longitude: 85.7366,
          qrCodeTag: 'GIFT-LABS-F1-LAB04',
        },
        media: {
          url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
          provider: 'cloudinary',
        },
        reportedBy: studentUser._id,
        reportedByName: studentUser.name,
        reportedByEmail: studentUser.email,
        assignedTo: staffUser._id,
        assignedToName: staffUser.name,
        upvotesCount: 11,
        statusHistory: [
          { status: 'Submitted', changedAt: new Date(Date.now() - 3600000 * 12), changedBy: 'Rohan Sharma', remarks: 'Reported' },
          { status: 'In Progress', changedAt: new Date(Date.now() - 3600000 * 4), changedBy: 'Prof. S. K. Patnaik', remarks: 'Assigned to Network Admin' },
        ],
      },
      {
        title: 'Cafeteria Recycling Bin Overflow',
        description: 'Organic and dry bins at outdoor cafeteria sitting area overflowing after lunch rush.',
        category: 'Cleanliness & Sanitation',
        severity: 'Low',
        priorityScore: 35,
        status: 'Resolved',
        location: {
          building: 'Cafeteria & Food Court',
          room: 'Outdoor Dining Deck',
          landmark: 'Beside Juice Bar',
          latitude: 20.2191,
          longitude: 85.7369,
          qrCodeTag: 'GIFT-CAFE-OUT-01',
        },
        media: {
          url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
          provider: 'cloudinary',
        },
        reportedByName: 'Amit Senapati',
        reportedByEmail: 'amit.s@gift.ac.in',
        assignedTo: staffUser._id,
        assignedToName: staffUser.name,
        upvotesCount: 2,
        resolutionDetails: {
          resolvedAt: new Date(Date.now() - 3600000 * 1),
          resolvedBy: staffUser._id,
          resolvedByName: staffUser.name,
          resolutionNotes: 'Bins cleared, sanitized, and additional recycle container installed.',
          resolutionMediaUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
        },
        statusHistory: [
          { status: 'Submitted', changedAt: new Date(Date.now() - 3600000 * 6), changedBy: 'Amit Senapati', remarks: 'Reported' },
          { status: 'In Progress', changedAt: new Date(Date.now() - 3600000 * 3), changedBy: 'Bikash Mohapatra', remarks: 'Cleaning crew dispatched' },
          { status: 'Resolved', changedAt: new Date(Date.now() - 3600000 * 1), changedBy: 'Bikash Mohapatra', remarks: 'Resolved & cleaned' },
        ],
      },
    ];

    await Issue.insertMany(sampleIssues);
    console.log('✅ Demo campus issues and users successfully initialized!');
  } catch (error) {
    console.warn('Seed data notice:', error.message);
  }
};

module.exports = seedInitialData;

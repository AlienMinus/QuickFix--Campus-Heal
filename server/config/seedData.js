const User = require('../models/User');
const Issue = require('../models/Issue');
const Institute = require('../models/Institute');
const bcrypt = require('bcryptjs');

const DEFAULT_INSTITUTES = [
  {
    name: 'BPUT Tech Campus',
    code: 'BPUT',
    location: 'Chhend Colony, Rourkela',
    city: 'Rourkela',
    state: 'Odisha',
    contactEmail: 'registrar@bput.ac.in',
  },
  {
    name: 'GIFT Autonomous College',
    code: 'GIFT',
    location: 'Gramadiha, Bhubaneswar',
    city: 'Bhubaneswar',
    state: 'Odisha',
    contactEmail: 'admin@gift.ac.in',
  },
  {
    name: 'Silicon Institute of Technology',
    code: 'SILICON',
    location: 'Silicon Hills, Patia',
    city: 'Bhubaneswar',
    state: 'Odisha',
    contactEmail: 'info@silicon.ac.in',
  },
  {
    name: 'NIT Rourkela',
    code: 'NITR',
    location: 'Sector 1, Rourkela',
    city: 'Rourkela',
    state: 'Odisha',
    contactEmail: 'estate@nitrkl.ac.in',
  },
  {
    name: 'CV Raman Global University',
    code: 'CVRGU',
    location: 'Bidyanagar, Mahura',
    city: 'Bhubaneswar',
    state: 'Odisha',
    contactEmail: 'contact@cvrgu.ac.in',
  },
  {
    name: 'IIT Bhubaneswar',
    code: 'IITBBS',
    location: 'Argul, Jatni',
    city: 'Bhubaneswar',
    state: 'Odisha',
    contactEmail: 'facility@iitbbs.ac.in',
  },
];

const seedInitialData = async () => {
  try {
    // 1. Ensure Default Institutes Exist
    for (const inst of DEFAULT_INSTITUTES) {
      const exists = await Institute.findOne({ code: inst.code });
      if (!exists) {
        await Institute.create(inst);
      }
    }

    const salt = await bcrypt.genSalt(10);
    const demoPassword = await bcrypt.hash('quickfix2026', salt);

    // 2. Ensure Super Admin Account Exists
    const existingSuperAdmin = await User.findOne({ email: 'superadmin@quickfix.org' });
    if (!existingSuperAdmin) {
      await User.create({
        name: 'Chief Super Admin (HQ)',
        email: 'superadmin@quickfix.org',
        password: demoPassword,
        role: 'superadmin',
        institute: 'Apex Multi-Campus Authority',
        department: 'Higher Education Governance & Audits',
        identifier: 'SUPER-CHIEF-01',
        phone: '+91 99999 00000',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      });
      console.log('👑 Super Admin account initialized: superadmin@quickfix.org / quickfix2026');
    }

    // 3. Backfill any existing users or issues without an institute
    await User.updateMany({ institute: { $exists: false } }, { $set: { institute: 'BPUT Tech Campus' } });
    await Issue.updateMany({ institute: { $exists: false } }, { $set: { institute: 'BPUT Tech Campus' } });

    const userCount = await User.countDocuments();
    if (userCount > 1) {
      return;
    }

    console.log('🌱 Seeding initial campus data for BPUT Tech Carnival 2026...');

    const adminUser = await User.create({
      name: 'Prof. S. K. Patnaik',
      email: 'admin.campus@gift.ac.in',
      password: demoPassword,
      role: 'admin',
      institute: 'BPUT Tech Campus',
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
      institute: 'BPUT Tech Campus',
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
      institute: 'BPUT Tech Campus',
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
        institute: 'BPUT Tech Campus',
        location: {
          building: 'Central Library Walkway',
          room: 'Pole #L-09',
          landmark: 'Pathway junction near fountain',
          latitude: 20.2194,
          longitude: 85.7359,
          qrCodeTag: 'GIFT-LIB-PATH-09',
        },
        media: {
          url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
          provider: 'cloudinary',
        },
        reportedBy: studentUser._id,
        reportedByName: studentUser.name,
        reportedByEmail: studentUser.email,
        assignedTo: staffUser._id,
        assignedToName: staffUser.name,
        upvotesCount: 4,
        statusHistory: [
          { status: 'Submitted', changedAt: new Date(Date.now() - 3600000 * 5), changedBy: studentUser.name, remarks: 'Issue filed' },
          { status: 'In Progress', changedAt: new Date(Date.now() - 3600000 * 2), changedBy: staffUser.name, remarks: 'Parts acquired, work in progress' },
        ],
      },
      {
        title: 'Water Pipe Leakage Flooding Washroom',
        description: 'A pressurized PVC pipe burst on the 2nd floor male washroom in Main Academic Block, causing rapid water accumulation.',
        category: 'Water Leakage & Plumbing',
        severity: 'Critical',
        priorityScore: 95,
        status: 'Submitted',
        institute: 'BPUT Tech Campus',
        location: {
          building: 'Main Academic Block (MAB)',
          room: 'Washroom 204 (2nd Floor)',
          landmark: 'Opposite Digital Lab A',
          latitude: 20.2196,
          longitude: 85.7361,
          qrCodeTag: 'GIFT-MAB-WASH-204',
        },
        media: {
          url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
          provider: 'cloudinary',
        },
        reportedBy: studentUser._id,
        reportedByName: 'Priya Nayak',
        reportedByEmail: 'priya.cse@gift.ac.in',
        upvotesCount: 7,
        statusHistory: [
          { status: 'Submitted', changedAt: new Date(Date.now() - 3600000 * 1), changedBy: 'Priya Nayak', remarks: 'High severity flooding reported' },
        ],
      },
      {
        title: 'Damaged Staircase Granite Edge',
        description: 'Chipped step corner on 1st-to-2nd floor north staircase in Tech Block B creates an acute trip hazard.',
        category: 'Damaged Infrastructure',
        severity: 'Medium',
        priorityScore: 50,
        status: 'Submitted',
        institute: 'BPUT Tech Campus',
        location: {
          building: 'Engineering & Computing Labs',
          room: 'North Staircase, Flight 2',
          landmark: 'Near Lift Shaft 2',
          latitude: 20.2199,
          longitude: 85.7367,
          qrCodeTag: 'GIFT-TECH-STAIR-N',
        },
        media: {
          url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?auto=format&fit=crop&w=800&q=80',
          provider: 'cloudinary',
        },
        reportedByName: 'Manoj Tripathy',
        reportedByEmail: 'manoj.faculty@gift.ac.in',
        upvotesCount: 1,
        statusHistory: [
          { status: 'Submitted', changedAt: new Date(Date.now() - 3600000 * 8), changedBy: 'Manoj Tripathy', remarks: 'Initial report filed' },
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

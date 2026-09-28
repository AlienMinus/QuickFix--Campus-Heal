const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Issue = require('../models/Issue');
const Institute = require('../models/Institute');
const Notification = require('../models/Notification');
const { parseCSV } = require('./csvHelper');

const seedInitialData = async () => {
  try {
    const institutesCsvPath = path.join(__dirname, '../data/institutes.csv');
    const usersCsvPath = path.join(__dirname, '../data/users.csv');
    const issuesCsvPath = path.join(__dirname, '../data/issues.csv');

    // 1. Seed Institutes from institutes.csv
    const institutesData = parseCSV(institutesCsvPath);
    for (const inst of institutesData) {
      if (!inst.code) continue;
      const exists = await Institute.findOne({ code: inst.code });
      if (!exists) {
        await Institute.create({
          name: inst.name,
          code: inst.code,
          location: inst.location,
          city: inst.city,
          state: inst.state,
          contactEmail: inst.contactEmail,
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const defaultHashedPassword = await bcrypt.hash('quickfix2026', salt);

    // 2. Seed Users from users.csv
    const usersData = parseCSV(usersCsvPath);
    for (const u of usersData) {
      if (!u.email) continue;
      const existingUser = await User.findOne({ email: u.email });
      if (!existingUser) {
        const hashedPassword = u.password
          ? await bcrypt.hash(u.password, salt)
          : defaultHashedPassword;

        await User.create({
          name: u.name,
          email: u.email,
          password: hashedPassword,
          role: u.role || 'student',
          institute: u.institute || 'BPUT Tech Campus',
          department: u.department || '',
          identifier: u.identifier || '',
          phone: u.phone || '',
          avatar: u.avatar || '',
        });
      }
    }

    // 3. Backfill any existing users, issues, or notifications without an institute
    await User.updateMany({ institute: { $exists: false } }, { $set: { institute: 'BPUT Tech Campus' } });
    await Issue.updateMany({ institute: { $exists: false } }, { $set: { institute: 'BPUT Tech Campus' } });

    const unassignedNotifs = await Notification.find({
      $or: [{ institute: { $exists: false } }, { institute: '' }, { institute: null }],
    });
    for (const notif of unassignedNotifs) {
      if (notif.issueId) {
        const issue = await Issue.findById(notif.issueId);
        if (issue && issue.institute) {
          notif.institute = issue.institute;
        }
      }
      if (notif.recipient) {
        notif.targetRole = 'personal';
      }
      if (notif.institute) {
        await notif.save();
      }
    }

    // 4. Remove any random unsplash avatars previously assigned to users
    await User.updateMany(
      { avatar: { $regex: 'images\\.unsplash\\.com/photo-(1534528741775|1500648767791|1507003211169|1539571696357)' } },
      { $set: { avatar: '' } }
    );

    // 5. Seed Issues from issues.csv if issue collection is empty
    const issueCount = await Issue.countDocuments();
    if (issueCount === 0) {
      const issuesData = parseCSV(issuesCsvPath);
      const studentDemo = await User.findOne({ role: 'student' });
      const staffDemo = await User.findOne({ role: 'staff' });

      for (const row of issuesData) {
        if (!row.title) continue;

        let reporter = null;
        if (row.reportedByEmail) {
          reporter = await User.findOne({ email: row.reportedByEmail });
        }
        if (!reporter) reporter = studentDemo;

        let assignee = null;
        if (row.assignedToEmail) {
          assignee = await User.findOne({ email: row.assignedToEmail });
        }
        if (!assignee && row.status === 'In Progress') assignee = staffDemo;

        const newIssue = new Issue({
          title: row.title,
          description: row.description,
          category: row.category,
          severity: row.severity || 'Medium',
          priorityScore: row.priorityScore ? parseInt(row.priorityScore, 10) : 50,
          status: row.status || 'Submitted',
          institute: row.institute || 'BPUT Tech Campus',
          location: {
            building: row.building || 'Campus',
            room: row.room || '',
            landmark: row.landmark || '',
            latitude: row.latitude ? parseFloat(row.latitude) : 20.2195,
            longitude: row.longitude ? parseFloat(row.longitude) : 85.7360,
            qrCodeTag: row.qrCodeTag || '',
          },
          media: {
            url: row.mediaUrl || '',
            provider: row.mediaProvider || 'cloudinary',
            mediaType: row.mediaType || 'image',
          },
          reportedBy: reporter ? reporter._id : null,
          reportedByName: row.reportedByName || reporter?.name || 'Campus Resident',
          reportedByEmail: reporter ? reporter.email : '',
          assignedTo: assignee ? assignee._id : null,
          assignedToName: row.assignedToName || assignee?.name || 'Unassigned',
          upvotesCount: row.upvotesCount ? parseInt(row.upvotesCount, 10) : 0,
          statusHistory: [
            {
              status: row.status || 'Submitted',
              changedAt: new Date(),
              changedBy: reporter?.name || 'System Seeder',
              remarks: 'Seeded from CSV dataset',
            },
          ],
        });

        await newIssue.save();
      }
    }

    console.log('✅ Seeding initialized from CSV files: institutes.csv, users.csv, issues.csv');
  } catch (error) {
    console.warn('Seed data notice:', error.message);
  }
};

module.exports = seedInitialData;

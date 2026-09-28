const Institute = require('../models/Institute');
const User = require('../models/User');
const Issue = require('../models/Issue');

// Get all active institutes (publicly available for registration & selection)
exports.getInstitutes = async (req, res) => {
  try {
    const institutes = await Institute.find().sort({ name: 1 });
    return res.status(200).json({
      success: true,
      count: institutes.length,
      institutes,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all institutes with their respective campus admins (Super Admin only)
exports.getInstitutesWithAdmins = async (req, res) => {
  try {
    const institutes = await Institute.find().sort({ name: 1 });
    const admins = await User.find({ role: 'admin' })
      .select('name email role institute department identifier phone createdAt')
      .sort({ name: 1 });

    const institutesWithAdmins = institutes.map((inst) => {
      const assignedAdmins = admins.filter(
        (a) => a.institute && a.institute.trim().toLowerCase() === inst.name.trim().toLowerCase()
      );
      return {
        _id: inst._id,
        name: inst.name,
        code: inst.code,
        location: inst.location,
        city: inst.city,
        state: inst.state,
        contactEmail: inst.contactEmail,
        contactPhone: inst.contactPhone,
        status: inst.status,
        createdAt: inst.createdAt,
        admins: assignedAdmins,
      };
    });

    const instituteNames = new Set(institutes.map((i) => i.name.trim().toLowerCase()));
    const unassignedAdmins = admins.filter(
      (a) => !a.institute || !instituteNames.has(a.institute.trim().toLowerCase())
    );

    return res.status(200).json({
      success: true,
      count: institutesWithAdmins.length,
      institutes: institutesWithAdmins,
      unassignedAdmins,
    });
  } catch (error) {
    console.error('Get Institutes With Admins Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new institute (Super Admin only)
exports.createInstitute = async (req, res) => {
  try {
    const { name, code, location, city, state, contactEmail, contactPhone } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Institute name and code are required' });
    }

    const existingCode = await Institute.findOne({ code: code.toUpperCase().trim() });
    if (existingCode) {
      return res.status(400).json({ success: false, message: `An institute with code ${code} already exists` });
    }

    const existingName = await Institute.findOne({ name: name.trim() });
    if (existingName) {
      return res.status(400).json({ success: false, message: `An institute named "${name}" already exists` });
    }

    const institute = await Institute.create({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      location: location?.trim() || 'Campus Area',
      city: city?.trim() || 'Bhubaneswar',
      state: state?.trim() || 'Odisha',
      contactEmail: contactEmail?.trim() || '',
      contactPhone: contactPhone?.trim() || '',
    });

    return res.status(201).json({
      success: true,
      message: `Institute ${institute.name} registered successfully`,
      institute,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update an institute (Super Admin only)
exports.updateInstitute = async (req, res) => {
  try {
    const { name, code, location, city, state, contactEmail, contactPhone, status } = req.body;

    const institute = await Institute.findById(req.params.id);
    if (!institute) {
      return res.status(404).json({ success: false, message: 'Institute not found' });
    }

    const oldName = institute.name;

    if (name) institute.name = name.trim();
    if (code) institute.code = code.toUpperCase().trim();
    if (location !== undefined) institute.location = location.trim();
    if (city !== undefined) institute.city = city.trim();
    if (state !== undefined) institute.state = state.trim();
    if (contactEmail !== undefined) institute.contactEmail = contactEmail.trim();
    if (contactPhone !== undefined) institute.contactPhone = contactPhone.trim();
    if (status) institute.status = status;

    await institute.save();

    // If institute name was updated, synchronize users and issues
    if (name && name.trim() !== oldName) {
      await User.updateMany({ institute: oldName }, { $set: { institute: name.trim() } });
      await Issue.updateMany({ institute: oldName }, { $set: { institute: name.trim() } });
    }

    return res.status(200).json({
      success: true,
      message: 'Institute updated successfully',
      institute,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete an institute (Super Admin only)
exports.deleteInstitute = async (req, res) => {
  try {
    const institute = await Institute.findById(req.params.id);
    if (!institute) {
      return res.status(404).json({ success: false, message: 'Institute not found' });
    }

    // Check if users exist in this institute
    const userCount = await User.countDocuments({ institute: institute.name });
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete ${institute.name}: ${userCount} users are currently assigned to this institute. Reassign them first.`,
      });
    }

    await Institute.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: `Institute ${institute.name} deleted successfully`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// System-wide Super Admin Overview
exports.getSuperAdminOverview = async (req, res) => {
  try {
    const institutes = await Institute.find().sort({ name: 1 });

    const totalInstitutes = institutes.length;
    const totalUsers = await User.countDocuments();
    const superAdminCount = await User.countDocuments({ role: 'superadmin' });
    const adminCount = await User.countDocuments({ role: 'admin' });
    const staffCount = await User.countDocuments({ role: 'staff' });
    const studentCount = await User.countDocuments({ role: 'student' });

    const totalIssues = await Issue.countDocuments();
    const resolvedIssues = await Issue.countDocuments({ status: 'Resolved' });
    const inProgressIssues = await Issue.countDocuments({ status: 'In Progress' });
    const submittedIssues = await Issue.countDocuments({ status: 'Submitted' });

    // Aggregate stats per institute
    const instituteStats = await Promise.all(
      institutes.map(async (inst) => {
        const instAdmins = await User.countDocuments({ institute: inst.name, role: 'admin' });
        const instStaff = await User.countDocuments({ institute: inst.name, role: 'staff' });
        const instStudents = await User.countDocuments({ institute: inst.name, role: 'student' });
        const instIssuesTotal = await Issue.countDocuments({ institute: inst.name });
        const instIssuesResolved = await Issue.countDocuments({ institute: inst.name, status: 'Resolved' });
        const instIssuesInProgress = await Issue.countDocuments({ institute: inst.name, status: 'In Progress' });

        return {
          id: inst._id,
          name: inst.name,
          code: inst.code,
          location: inst.location,
          city: inst.city,
          state: inst.state,
          status: inst.status,
          adminsCount: instAdmins,
          staffCount: instStaff,
          studentsCount: instStudents,
          totalUsers: instAdmins + instStaff + instStudents,
          totalIssues: instIssuesTotal,
          resolvedIssues: instIssuesResolved,
          inProgressIssues: instIssuesInProgress,
          resolutionRate: instIssuesTotal > 0 ? Math.round((instIssuesResolved / instIssuesTotal) * 100) : 0,
        };
      })
    );

    return res.status(200).json({
      success: true,
      stats: {
        totalInstitutes,
        totalUsers,
        usersByRole: {
          superadmin: superAdminCount,
          admin: adminCount,
          staff: staffCount,
          student: studentCount,
        },
        issuesSummary: {
          total: totalIssues,
          resolved: resolvedIssues,
          inProgress: inProgressIssues,
          submitted: submittedIssues,
          overallResolutionRate: totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0,
        },
        institutes: instituteStats,
      },
    });
  } catch (error) {
    console.error('Super Admin Overview Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const DEFAULT_BRANCHES = [
  'Computer Science & Engineering (CSE)',
  'Artificial Intelligence & Data Science (AI&DS)',
  'Mechanical Engineering (ME)',
  'Electrical & Electronics Engineering (EEE)',
  'Electronics & Comm Engineering (ECE)',
  'Civil Engineering (CE)',
  'Master of Computer Applications (MCA)',
  'MBA / Management Studies',
  'Campus Estate & Facility Maintenance',
  'Hostel Administration & Mess',
];

// Get current admin's institute profile (Admin & Super Admin)
exports.getMyInstitute = async (req, res) => {
  try {
    const instituteName = req.user.institute;
    if (!instituteName) {
      return res.status(400).json({ success: false, message: 'User is not assigned to any institute' });
    }

    let institute = await Institute.findOne({ name: instituteName.trim() });
    if (!institute) {
      institute = await Institute.findOne({
        name: { $regex: new RegExp(`^${instituteName.trim()}$`, 'i') },
      });
    }

    if (!institute) {
      return res.status(404).json({ success: false, message: `Institute "${instituteName}" not found` });
    }

    const branches = institute.branches && institute.branches.length > 0 ? institute.branches : DEFAULT_BRANCHES;

    return res.status(200).json({
      success: true,
      institute: {
        _id: institute._id,
        name: institute.name,
        code: institute.code,
        location: institute.location,
        city: institute.city,
        state: institute.state,
        headerConfig: institute.headerConfig || { name: institute.name, subtitle: '', tagline: '' },
        branches,
        zones: institute.zones || [],
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update header config for admin's own institute (Normal admin only)
exports.updateMyInstituteHeader = async (req, res) => {
  try {
    const instituteName = req.user.institute;
    if (!instituteName) {
      return res.status(400).json({ success: false, message: 'User is not assigned to an institute' });
    }

    const { name, subtitle, tagline } = req.body;
    let institute = await Institute.findOne({ name: instituteName.trim() });
    if (!institute) {
      institute = await Institute.findOne({
        name: { $regex: new RegExp(`^${instituteName.trim()}$`, 'i') },
      });
    }

    if (!institute) {
      return res.status(404).json({ success: false, message: `Institute "${instituteName}" not found` });
    }

    institute.headerConfig = {
      name: name?.trim() || institute.name,
      subtitle: subtitle?.trim() || '',
      tagline: tagline?.trim() || '',
    };

    await institute.save();

    return res.status(200).json({
      success: true,
      message: `Header customization for ${institute.name} saved successfully`,
      headerConfig: institute.headerConfig,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get branches for admin's own institute
exports.getMyInstituteBranches = async (req, res) => {
  try {
    const instituteName = req.user.institute;
    if (!instituteName) {
      return res.status(400).json({ success: false, message: 'User is not assigned to an institute' });
    }

    let institute = await Institute.findOne({ name: instituteName.trim() });
    if (!institute) {
      institute = await Institute.findOne({
        name: { $regex: new RegExp(`^${instituteName.trim()}$`, 'i') },
      });
    }

    const branches = institute?.branches && institute.branches.length > 0 ? institute.branches : DEFAULT_BRANCHES;

    return res.status(200).json({
      success: true,
      institute: institute?.name || instituteName,
      branches,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update branches for admin's own institute (Normal admin only)
exports.updateMyInstituteBranches = async (req, res) => {
  try {
    const instituteName = req.user.institute;
    if (!instituteName) {
      return res.status(400).json({ success: false, message: 'User is not assigned to an institute' });
    }

    const { branches } = req.body;
    if (!Array.isArray(branches)) {
      return res.status(400).json({ success: false, message: 'Branches must be an array of strings' });
    }

    const cleanBranches = [...new Set(branches.map(b => (typeof b === 'string' ? b.trim() : '')).filter(Boolean))];

    if (cleanBranches.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one branch/stream is required' });
    }

    let institute = await Institute.findOne({ name: instituteName.trim() });
    if (!institute) {
      institute = await Institute.findOne({
        name: { $regex: new RegExp(`^${instituteName.trim()}$`, 'i') },
      });
    }

    if (!institute) {
      return res.status(404).json({ success: false, message: `Institute "${instituteName}" not found` });
    }

    institute.branches = cleanBranches;
    await institute.save();

    return res.status(200).json({
      success: true,
      message: `Branches for ${institute.name} updated successfully`,
      branches: institute.branches,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Public endpoint: Get branches for a specific institute by name or ID (Used by RegisterPage)
exports.getInstituteBranches = async (req, res) => {
  try {
    const { identifier } = req.params;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Institute identifier required' });
    }

    let institute = null;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      institute = await Institute.findById(identifier);
    }
    if (!institute) {
      institute = await Institute.findOne({
        $or: [
          { name: identifier.trim() },
          { name: { $regex: new RegExp(`^${identifier.trim()}$`, 'i') } },
          { code: identifier.trim().toUpperCase() },
        ],
      });
    }

    const branches = institute?.branches && institute.branches.length > 0 ? institute.branches : DEFAULT_BRANCHES;

    return res.status(200).json({
      success: true,
      institute: institute?.name || identifier,
      branches,
      headerConfig: institute?.headerConfig || null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getMediaUrl } = require('../config/cloudinary');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
      institute: user.institute || 'BPUT Tech Campus',
    },
    process.env.JWT_SECRET || 'bput_tech_carnival_2026_jwt_secret_7days',
    {
      expiresIn: '7d',
    }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department, identifier, phone, institute } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Prevent direct self-registration as superadmin for security
    const assignedRole = role === 'superadmin' ? 'student' : (role || 'student');

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: assignedRole,
      institute: institute?.trim() || 'BPUT Tech Campus',
      department: department || 'General Campus',
      identifier: identifier || '',
      phone: phone || '',
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully with 7-day active session',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institute: user.institute,
        department: user.department,
        identifier: user.identifier,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Register Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful (7-day validity token)',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institute: user.institute || 'BPUT Tech Campus',
        department: user.department,
        identifier: user.identifier,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.demoLogin = async (req, res) => {
  try {
    const { role } = req.body;
    const targetRole = ['student', 'staff', 'admin', 'superadmin'].includes(role) ? role : 'student';

    const demoProfiles = {
      student: {
        email: 'student.demo@gift.ac.in',
        name: 'Rohan Sharma (Student)',
        role: 'student',
        institute: 'BPUT Tech Campus',
        department: 'Computer Science & Engineering (7th Sem)',
        identifier: 'GIFT-2022-CSE-042',
        avatar: '',
      },
      staff: {
        email: 'maintenance.staff@gift.ac.in',
        name: 'Bikash Mohapatra (Staff)',
        role: 'staff',
        institute: 'BPUT Tech Campus',
        department: 'Campus Electrical & Facilities Maintenance',
        identifier: 'STAFF-EM-108',
        avatar: '',
      },
      admin: {
        email: 'admin.campus@gift.ac.in',
        name: 'Prof. S. K. Patnaik (Campus Admin)',
        role: 'admin',
        institute: 'BPUT Tech Campus',
        department: 'BPUT / GIFT Central Administration',
        identifier: 'ADMIN-CENTRAL-001',
        avatar: '',
      },
      superadmin: {
        email: 'superadmin@quickfix.org',
        name: 'Chief Super Admin (HQ)',
        role: 'superadmin',
        institute: 'Apex Multi-Campus Authority',
        department: 'Higher Education Governance & Audits',
        identifier: 'SUPER-CHIEF-01',
        avatar: '',
      },
    };

    const targetProfile = demoProfiles[targetRole];

    let user = await User.findOne({ email: targetProfile.email });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('quickfix2026', salt);
      user = await User.create({
        ...targetProfile,
        password: hashedPassword,
      });
    } else if (user.avatar && user.avatar.includes('images.unsplash.com')) {
      // Clean up previous random unsplash picture
      user.avatar = '';
      await user.save();
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: `Logged in as demo ${targetRole} with 7-day token`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institute: user.institute || 'BPUT Tech Campus',
        department: user.department,
        identifier: user.identifier,
        avatar: user.avatar || '',
      },
    });
  } catch (error) {
    console.error('Demo Login Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let avatarUrl = '';
    if (req.file) {
      const media = getMediaUrl(req, req.file);
      if (media && media.url) {
        avatarUrl = media.url;
      }
    } else if (req.body.avatar) {
      avatarUrl = req.body.avatar;
    } else {
      return res.status(400).json({ success: false, message: 'No avatar image provided' });
    }

    user.avatar = avatarUrl;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      avatar: user.avatar,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institute: user.institute,
        department: user.department,
        identifier: user.identifier,
        phone: user.phone,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Update Avatar Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.avatar = '';
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile picture removed successfully',
      avatar: '',
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institute: user.institute,
        department: user.department,
        identifier: user.identifier,
        phone: user.phone,
        avatar: '',
      },
    });
  } catch (error) {
    console.error('Remove Avatar Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, department, identifier, phone, removeAvatar } = req.body;
    if (name) user.name = name.trim();
    if (department !== undefined) user.department = department.trim();
    if (identifier !== undefined) user.identifier = identifier.trim();
    if (phone !== undefined) user.phone = phone.trim();

    if (removeAvatar === 'true' || removeAvatar === true) {
      user.avatar = '';
    } else if (req.file) {
      const media = getMediaUrl(req, req.file);
      if (media && media.url) user.avatar = media.url;
    } else if (req.body.avatar !== undefined) {
      user.avatar = req.body.avatar;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institute: user.institute,
        department: user.department,
        identifier: user.identifier,
        phone: user.phone,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

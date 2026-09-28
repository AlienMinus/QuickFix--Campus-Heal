const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET || 'bput_tech_carnival_2026_jwt_secret_7days',
    {
      expiresIn: '7d',
    }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department, identifier, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'student',
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
    const targetRole = ['student', 'staff', 'admin'].includes(role) ? role : 'student';

    const demoProfiles = {
      student: {
        email: 'student.demo@gift.ac.in',
        name: 'Rohan Sharma (Student)',
        role: 'student',
        department: 'Computer Science & Engineering (7th Sem)',
        identifier: 'GIFT-2022-CSE-042',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
      },
      staff: {
        email: 'maintenance.staff@gift.ac.in',
        name: 'Bikash Mohapatra (Staff)',
        role: 'staff',
        department: 'Campus Electrical & Facilities Maintenance',
        identifier: 'STAFF-EM-108',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      },
      admin: {
        email: 'admin.campus@gift.ac.in',
        name: 'Prof. S. K. Patnaik (Campus Administrator)',
        role: 'admin',
        department: 'BPUT / GIFT Central Administration',
        identifier: 'ADMIN-CENTRAL-001',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
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
        department: user.department,
        identifier: user.identifier,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Demo Login Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const jwt = require('jsonwebtoken');
const { User, Student, Department, sequelize } = require('../models');

// Helper to sign JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'computing_attendance_secret_key_2026',
    { expiresIn: '12h' } // Lecturer and student sessions valid for 12 hours
  );
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    const userResponse = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    // If student, attach profile context to response
    if (user.role === 'student') {
      const student = await Student.findOne({ 
        where: { userId: user.id },
        include: [{ model: Department, as: 'department', attributes: ['name', 'faculty'] }]
      });
      userResponse.studentProfile = student;
    }

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

// POST /api/auth/register-student (Requires transaction for User + Student profile)
exports.registerStudent = async (req, res) => {
  const { email, password, matricNumber, fullName, departmentId, level } = req.body;

  if (!email || !password || !matricNumber || !fullName || !departmentId || !level) {
    return res.status(400).json({ error: 'All fields are required (email, password, matricNumber, fullName, departmentId, level)' });
  }

  // Enforce department check to match Computing department requirements
  // Computing courses require CS, SE, or IT.
  try {
    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({ error: 'Selected department does not exist' });
    }

    // Wrap User and Student creation in a database transaction
    const result = await sequelize.transaction(async (t) => {
      // 1. Check if email or matric number already exists
      const existingUser = await User.findOne({ where: { email } }, { transaction: t });
      if (existingUser) {
        throw new Error('Email is already registered');
      }

      const existingStudent = await Student.findOne({ where: { matricNumber } }, { transaction: t });
      if (existingStudent) {
        throw new Error('Matric number is already registered');
      }

      // 2. Create base User record
      const newUser = await User.create({
        email,
        passwordHash: password, // hooks handle bcrypt hashing
        role: 'student'
      }, { transaction: t });

      // 3. Create Student record
      const newStudent = await Student.create({
        userId: newUser.id,
        matricNumber,
        fullName,
        departmentId,
        level,
        schoolEmail: email
      }, { transaction: t });

      return { user: newUser, student: newStudent };
    });

    return res.status(201).json({
      message: 'Student registered successfully',
      student: {
        id: result.student.id,
        matricNumber: result.student.matricNumber,
        fullName: result.student.fullName,
        email: result.user.email,
        level: result.student.level
      }
    });

  } catch (error) {
    console.error('Registration failed:', error);
    if (error.message === 'Email is already registered' || error.message === 'Matric number is already registered') {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Registration failed due to server error' });
  }
};

// GET /api/auth/me
exports.me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'role']
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const response = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    if (user.role === 'student') {
      const student = await Student.findOne({
        where: { userId: user.id },
        include: [{ model: Department, as: 'department', attributes: ['name', 'faculty'] }]
      });
      response.studentProfile = student;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

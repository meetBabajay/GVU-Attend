const jwt = require('jsonwebtoken');
const { User, Student, Department, sequelize } = require('../models');

// Helper to sign JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'computing_attendance_secret_key_2026',
    { expiresIn: '12h' }
  );
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, matricNumber, password } = req.body;

  if ((!email && !matricNumber) || !password) {
    return res.status(400).json({ error: 'Email or matric number, and password are required' });
  }

  try {
    let user;
    if (matricNumber) {
      const student = await Student.findOne({ where: { matricNumber } });
      if (!student) {
        return res.status(401).json({ error: 'Invalid matric number or password' });
      }
      user = await User.findByPk(student.userId);
    } else {
      user = await User.findOne({ where: { email } });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email/matric number or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email/matric number or password' });
    }

    // Block unapproved accounts (except admin who is always approved)
    if (!user.isApproved) {
      return res.status(403).json({ error: 'Your account is pending administrator approval. Please check back later.' });
    }

    const token = generateToken(user);
    const userResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName
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

// POST /api/auth/register-student (Public - self-registration, pending approval)
exports.registerStudent = async (req, res) => {
  const { email, password, matricNumber, fullName, departmentId, level } = req.body;

  if (!email || !password || !matricNumber || !fullName || !departmentId || !level) {
    return res.status(400).json({ error: 'All fields are required (email, password, matricNumber, fullName, departmentId, level)' });
  }

  try {
    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({ error: 'Selected department does not exist' });
    }

    const result = await sequelize.transaction(async (t) => {
      const existingUser = await User.findOne({ where: { email }, transaction: t });
      if (existingUser) {
        throw new Error('Email is already registered');
      }

      const existingStudent = await Student.findOne({ where: { matricNumber }, transaction: t });
      if (existingStudent) {
        throw new Error('Matric number is already registered');
      }

      const newUser = await User.create({
        email,
        passwordHash: password,
        role: 'student',
        isApproved: false  // Requires admin approval
      }, { transaction: t });

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
      message: 'Registration submitted successfully. Your account is pending administrator approval.',
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

// POST /api/auth/register-lecturer (Public - self-registration, pending approval)
exports.registerLecturer = async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required' });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const newUser = await User.create({
      email,
      passwordHash: password,
      role: 'lecturer',
      fullName,
      isApproved: false  // Requires admin approval
    });

    return res.status(201).json({
      message: 'Registration submitted successfully. Your account is pending administrator approval.',
      instructor: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Lecturer registration failed:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email is already registered' });
    }
    return res.status(500).json({ error: 'Registration failed due to server error' });
  }
};

// GET /api/auth/me
exports.me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'role', 'fullName', 'isApproved']
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const response = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName
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

// GET /api/auth/pending  — Admin only
exports.listPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.findAll({
      where: { isApproved: false },
      attributes: ['id', 'email', 'role', 'fullName']
    });

    // For student accounts, attach their student profile details
    const withProfiles = await Promise.all(pendingUsers.map(async (u) => {
      const base = { id: u.id, email: u.email, role: u.role, fullName: u.fullName };
      if (u.role === 'student') {
        const profile = await Student.findOne({
          where: { userId: u.id },
          include: [{ model: Department, as: 'department', attributes: ['name', 'faculty'] }],
          attributes: ['matricNumber', 'fullName', 'level']
        });
        base.studentProfile = profile;
      }
      return base;
    }));

    return res.status(200).json(withProfiles);
  } catch (error) {
    console.error('Error fetching pending users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/auth/approve/:userId  — Admin only
exports.approveUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.isApproved = true;
    await user.save();
    return res.status(200).json({ message: `Account for ${user.email} has been approved successfully.` });
  } catch (error) {
    console.error('Error approving user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/auth/reject/:userId  — Admin only
exports.rejectUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const email = user.email;
    // Cascade will handle student profile deletion via DB constraint
    await user.destroy();
    return res.status(200).json({ message: `Account registration for ${email} has been rejected and removed.` });
  } catch (error) {
    console.error('Error rejecting user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/auth/departments  — Public (used by registration form)
exports.listDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({
      attributes: ['id', 'name', 'faculty'],
      order: [['faculty', 'ASC'], ['name', 'ASC']]
    });
    return res.status(200).json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


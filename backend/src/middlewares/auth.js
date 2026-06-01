const jwt = require('jsonwebtoken');
const { User, Student } = require('../models');

// Authenticate JWT token and attach user to request object
const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token is missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'computing_attendance_secret_key_2026');
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User does not exist or has been disabled' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    // If the user is a student, attach their student profile details (matric number, dept id, level, student table id)
    if (user.role === 'student') {
      const student = await Student.findOne({ where: { userId: user.id } });
      if (!student) {
        return res.status(403).json({ error: 'Student profile not found. Please contact administration.' });
      }
      req.student = student;
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token has expired. Please login again.' });
    }
    return res.status(403).json({ error: 'Invalid access token' });
  }
};

// Check if user has the lecturer role
const isLecturer = (req, res, next) => {
  if (!req.user || req.user.role !== 'lecturer') {
    return res.status(403).json({ error: 'Unauthorized: Lecturer level access required' });
  }
  next();
};

// Check if user has the student role
const isStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ error: 'Unauthorized: Student level access required' });
  }
  next();
};

module.exports = {
  authenticateJWT,
  isLecturer,
  isStudent
};

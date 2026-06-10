const jwt = require('jsonwebtoken');
const { User, Student, Department } = require('../models');

const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied: Token is missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'computing_attendance_secret_key_2026');
    req.user = decoded;

    // Load student profile if role is student
    if (decoded.role === 'student') {
      const student = await Student.findOne({
        where: { userId: decoded.id },
        include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'faculty'] }]
      });
      if (!student) {
        return res.status(404).json({ error: 'Student profile not found' });
      }
      req.student = student;
    }

    next();
  } catch (error) {
    console.error('JWT authentication error:', error);
    return res.status(403).json({ error: 'Access denied: Invalid token signature or expired' });
  }
};

const isLecturer = (req, res, next) => {
  if (req.user && req.user.role === 'lecturer') {
    next();
  } else {
    return res.status(403).json({ error: 'Access denied: Lecturer privileges required' });
  }
};

const isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    return res.status(403).json({ error: 'Access denied: Student privileges required' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Access denied: Administrator privileges required' });
  }
};

module.exports = {
  authenticateJWT,
  isLecturer,
  isStudent,
  isAdmin
};
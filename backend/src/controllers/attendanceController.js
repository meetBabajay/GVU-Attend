const { Attendance, ClassSession, Course, Student, CourseRegistration, AttendanceLog, Department, sequelize } = require('../models');
const { haversineDistance } = require('../utils/geo');
const { verifyQRToken } = require('../utils/qr');

// POST /api/attendance/submit - Student signs attendance
exports.submitAttendance = async (req, res) => {
  const { classSessionId, qrToken, latitude, longitude, deviceFingerprint } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

  if (!classSessionId || !qrToken || latitude === undefined || longitude === undefined || !deviceFingerprint) {
    return res.status(400).json({ error: 'Missing required parameters: classSessionId, qrToken, latitude, longitude, deviceFingerprint' });
  }

  const student = req.student; // Loaded by authenticateJWT middleware
  const matricNumber = student.matricNumber;

  try {
    // 1. Fetch class session and check if active
    const session = await ClassSession.findByPk(classSessionId, {
      include: [{ model: Course, as: 'course', include: [{ model: Department, as: 'department' }] }]
    });

    if (!session) {
      return res.status(404).json({ error: 'Class session not found' });
    }

    if (!session.isActive) {
      await AttendanceLog.create({
        classSessionId, matricNumber, ipAddress, deviceFingerprint,
        status: 'failed', failureReason: 'Attendance session is not active',
        latitude, longitude
      });
      return res.status(400).json({ error: 'Attendance signing is currently closed for this class' });
    }

    // 2. Course Registration & Department check
    const isEnrolled = await CourseRegistration.findOne({
      where: { studentId: student.id, courseId: session.courseId }
    });

    if (!isEnrolled) {
      await AttendanceLog.create({
        classSessionId, matricNumber, ipAddress, deviceFingerprint,
        status: 'failed', failureReason: 'Student is not registered for this course',
        latitude, longitude
      });
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }

    // Double check student department belongs to the same department faculty
    const studentDept = await Department.findByPk(student.departmentId);
    if (studentDept.faculty !== session.course.department.faculty) {
      await AttendanceLog.create({
        classSessionId, matricNumber, ipAddress, deviceFingerprint,
        status: 'failed', failureReason: `Department restriction mismatch: ${studentDept.name} vs Course Department ${session.course.department.name}`,
        latitude, longitude
      });
      return res.status(403).json({ error: 'Your department is not permitted to sign attendance for this course' });
    }

    // 3. Verify Dynamic QR Token
    try {
      verifyQRToken(qrToken, classSessionId, session.qrSecretSalt);
    } catch (qrErr) {
      await AttendanceLog.create({
        classSessionId, matricNumber, ipAddress, deviceFingerprint,
        status: 'failed', failureReason: `QR Code verification failed: ${qrErr.message}`,
        latitude, longitude
      });
      return res.status(400).json({ error: qrErr.message });
    }

    // 4. GPS Distance Check (Haversine formula)
    const distanceMeters = haversineDistance(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(session.latitude),
      parseFloat(session.longitude)
    );

    const isInsideRadius = distanceMeters <= session.allowedRadiusMeters;
    if (!isInsideRadius) {
      await AttendanceLog.create({
        classSessionId, matricNumber, ipAddress, deviceFingerprint,
        status: 'failed', failureReason: `GPS verification failed: Student is outside radius (${distanceMeters.toFixed(1)}m away, allowed: ${session.allowedRadiusMeters}m)`,
        latitude, longitude
      });
      return res.status(400).json({
        error: `GPS verification failed. You are physically too far from the classroom (${distanceMeters.toFixed(0)} meters away).`
      });
    }

    // 5. Device Control: Prevent multiple submissions from same device fingerprint in this session
    const duplicateDevice = await Attendance.findOne({
      where: { classSessionId, deviceFingerprint }
    });

    if (duplicateDevice) {
      await AttendanceLog.create({
        classSessionId, matricNumber, ipAddress, deviceFingerprint,
        status: 'failed', failureReason: `Proxy signing warning: Device fingerprint already signed attendance in this session`,
        latitude, longitude
      });
      return res.status(400).json({
        error: 'Submission rejected: This device has already been used to sign attendance for another student in this session.'
      });
    }

    // 6. Record verified attendance and log success
    await sequelize.transaction(async (t) => {
      await Attendance.create({
        classSessionId,
        studentId: student.id,
        status: 'present',
        deviceFingerprint,
        ipAddress,
        distanceMeters: distanceMeters.toFixed(2),
        verifiedGps: true
      }, { transaction: t });

      await AttendanceLog.create({
        classSessionId, matricNumber, ipAddress, deviceFingerprint,
        status: 'success', latitude, longitude
      }, { transaction: t });
    });

    return res.status(200).json({
      message: 'Attendance signed successfully',
      distanceMeters: distanceMeters.toFixed(1),
      status: 'present'
    });

  } catch (error) {
    console.error('Error signing attendance:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'You have already signed attendance for this session' });
    }
    return res.status(500).json({ error: 'Server error during attendance submission' });
  }
};

// GET /api/attendance/session/:sessionId - List all signed attendances for a session (Lecturer only)
exports.listSessionAttendance = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await ClassSession.findByPk(sessionId, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!session) {
      return res.status(404).json({ error: 'Class session not found' });
    }

    if (session.course.lecturerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not teach this course' });
    }

    const attendances = await Attendance.findAll({
      where: { classSessionId: sessionId },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['matricNumber', 'fullName', 'level', 'schoolEmail'],
          include: [{ model: Department, as: 'department', attributes: ['name'] }]
        }
      ],
      order: [['signedAt', 'ASC']]
    });

    return res.status(200).json(attendances);
  } catch (error) {
    console.error('Error fetching session attendance:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/attendance/student/:studentId - Get attendance logs for a student
exports.listStudentAttendance = async (req, res) => {
  const { studentId } = req.params;

  try {
    // Access validation: Student can only view their own history. Lecturers can view any student's history.
    if (req.user.role === 'student') {
      const student = await Student.findOne({ where: { userId: req.user.id } });
      if (!student || student.id !== studentId) {
        return res.status(403).json({ error: 'Unauthorized: You can only view your own history' });
      }
    }

    const records = await Attendance.findAll({
      where: { studentId },
      include: [
        {
          model: ClassSession,
          as: 'session',
          attributes: ['sessionName', 'date', 'roomLocation'],
          include: [{ model: Course, as: 'course', attributes: ['courseCode', 'courseTitle'] }]
        }
      ],
      order: [['signedAt', 'DESC']]
    });

    return res.status(200).json(records);
  } catch (error) {
    console.error('Error fetching student attendance history:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/attendance/student-stats/:courseId - Get a student's course attendance percentage
exports.getStudentCourseStats = async (req, res) => {
  const { courseId } = req.params;

  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // 1. Get total sessions held for this course
    const totalSessions = await ClassSession.count({
      where: { courseId, isActive: false } // Only count sessions that are closed/completed
    });

    // 2. Get sessions student signed present
    const attendedSessions = await Attendance.count({
      where: { studentId: student.id, status: 'present' },
      include: [
        {
          model: ClassSession,
          as: 'session',
          where: { courseId }
        }
      ]
    });

    const percentage = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 100;

    return res.status(200).json({
      courseId,
      totalSessions,
      attendedSessions,
      percentage: parseFloat(percentage.toFixed(1))
    });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

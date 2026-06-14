const { Op } = require('sequelize');
const { TestScore, Course, Student, Attendance, ClassSession, CourseRegistration, User, Department } = require('../models');

// GET /api/scores/student - Get student's course scoreboard
exports.getStudentScores = async (req, res) => {
  try {
    const student = req.student; // Loaded by authenticateJWT middleware
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Get all enrolled courses
    const enrolledCourses = await Course.findAll({
      include: [
        {
          model: Student,
          where: { id: student.id },
          attributes: [],
          through: { attributes: [] }
        },
        { model: Department, as: 'department', attributes: ['name', 'faculty'] }
      ]
    });

    const scoreboard = [];

    for (const course of enrolledCourses) {
      // 1. Calculate attendance score: COUNT(attendance WHERE status = 'present' for this course)
      const attendanceScore = await Attendance.count({
        include: [{
          model: ClassSession,
          as: 'session',
          where: { courseId: course.id }
        }],
        where: {
          studentId: student.id,
          status: 'present'
        }
      });

      // 2. Fetch test score
      const testScoreRecord = await TestScore.findOne({
        where: {
          studentId: student.userId,
          courseId: course.id
        }
      });

      const testScore = testScoreRecord ? parseFloat(testScoreRecord.score) : null;
      const totalScore = testScore !== null ? (attendanceScore + testScore) : null;

      scoreboard.push({
        courseId: course.id,
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        level: course.level,
        departmentName: course.department?.name,
        attendanceScore,
        testScore,
        totalScore
      });
    }

    return res.status(200).json(scoreboard);
  } catch (error) {
    console.error('Error fetching student scores:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/scores/course/:id - Get scoreboard for a course (Instructor/Admin only)
exports.getCourseScores = async (req, res) => {
  const { id: courseId } = req.params;

  try {
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Authorization: Only assigned lecturer or admin can access
    if (req.user.role !== 'admin' && course.lecturerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not teach this course' });
    }

    // Get all enrolled students
    const enrolledStudents = await Student.findAll({
      include: [
        {
          model: Course,
          where: { id: courseId },
          attributes: [],
          through: { attributes: [] }
        },
        { model: Department, as: 'department', attributes: ['name'] }
      ],
      attributes: ['id', 'matricNumber', 'fullName', 'level', 'schoolEmail', 'userId']
    });

    const scoreboard = [];

    for (const student of enrolledStudents) {
      // 1. Calculate attendance score
      const attendanceScore = await Attendance.count({
        include: [{
          model: ClassSession,
          as: 'session',
          where: { courseId }
        }],
        where: {
          studentId: student.id,
          status: 'present'
        }
      });

      // 2. Fetch test score
      const testScoreRecord = await TestScore.findOne({
        where: {
          studentId: student.userId,
          courseId
        }
      });

      const testScore = testScoreRecord ? parseFloat(testScoreRecord.score) : null;
      const testScoreId = testScoreRecord ? testScoreRecord.id : null;
      const totalScore = testScore !== null ? (attendanceScore + testScore) : null;

      scoreboard.push({
        studentId: student.id,
        userId: student.userId,
        fullName: student.fullName,
        matricNumber: student.matricNumber,
        level: student.level,
        schoolEmail: student.schoolEmail,
        departmentName: student.department?.name,
        attendanceScore,
        testScore,
        testScoreId,
        totalScore
      });
    }

    return res.status(200).json({
      course: {
        id: course.id,
        courseCode: course.courseCode,
        courseTitle: course.courseTitle
      },
      students: scoreboard
    });
  } catch (error) {
    console.error('Error fetching course scores:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/scores/test - Create or Update a test score
exports.createOrUpdateTestScore = async (req, res) => {
  const { studentId, courseId, score } = req.body;

  if (!studentId || !courseId || score === undefined || score === null) {
    return res.status(400).json({ error: 'Student ID, Course ID, and Score are required' });
  }

  const parsedScore = parseFloat(score);
  if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
    return res.status(400).json({ error: 'Score must be a number between 0 and 100' });
  }

  try {
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Authorization: Only assigned lecturer or admin can submit scores
    if (req.user.role !== 'admin' && course.lecturerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not teach this course' });
    }

    // Resolve studentId — accept either the Student profile UUID or the User UUID
    let student = await Student.findOne({ where: { id: studentId } }).catch(() => null);
    if (!student) {
      // Fallback: maybe caller passed the user (userId) instead
      student = await Student.findOne({ where: { userId: studentId } }).catch(() => null);
    }

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }
    const studentUserId = student.userId;

    // Check if student is enrolled in the course
    const isEnrolled = await CourseRegistration.findOne({
      where: {
        studentId: student.id,
        courseId
      }
    });

    if (!isEnrolled) {
      return res.status(400).json({ error: 'Student is not enrolled in this course' });
    }

    // Upsert the test score record
    let [testScoreRecord, created] = await TestScore.findOrCreate({
      where: {
        studentId: studentUserId,
        courseId
      },
      defaults: {
        score: parsedScore,
        createdBy: req.user.id
      }
    });

    if (!created) {
      testScoreRecord.score = parsedScore;
      testScoreRecord.createdBy = req.user.id;
      testScoreRecord.updatedAt = new Date();
      await testScoreRecord.save();
    }

    return res.status(200).json({
      message: 'Test score saved successfully',
      testScore: {
        id: testScoreRecord.id,
        studentId: testScoreRecord.studentId,
        courseId: testScoreRecord.courseId,
        score: parseFloat(testScoreRecord.score),
        createdBy: testScoreRecord.createdBy,
        updatedAt: testScoreRecord.updatedAt
      }
    });
  } catch (error) {
    console.error('Error saving test score:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PATCH /api/scores/test/:id - Update an existing test score by record ID
exports.updateTestScore = async (req, res) => {
  const { id } = req.params;
  const { score } = req.body;

  if (score === undefined || score === null) {
    return res.status(400).json({ error: 'Score is required' });
  }

  const parsedScore = parseFloat(score);
  if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
    return res.status(400).json({ error: 'Score must be a number between 0 and 100' });
  }

  try {
    const testScoreRecord = await TestScore.findByPk(id);
    if (!testScoreRecord) {
      return res.status(404).json({ error: 'Test score record not found' });
    }

    const course = await Course.findByPk(testScoreRecord.courseId);
    if (!course) {
      return res.status(404).json({ error: 'Associated course not found' });
    }

    // Authorization: Only assigned lecturer or admin can edit
    if (req.user.role !== 'admin' && course.lecturerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not teach this course' });
    }

    testScoreRecord.score = parsedScore;
    testScoreRecord.createdBy = req.user.id;
    testScoreRecord.updatedAt = new Date();
    await testScoreRecord.save();

    return res.status(200).json({
      message: 'Test score updated successfully',
      testScore: {
        id: testScoreRecord.id,
        studentId: testScoreRecord.studentId,
        courseId: testScoreRecord.courseId,
        score: parseFloat(testScoreRecord.score),
        createdBy: testScoreRecord.createdBy,
        updatedAt: testScoreRecord.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating test score:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

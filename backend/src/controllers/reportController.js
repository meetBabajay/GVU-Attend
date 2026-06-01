const { Course, Student, ClassSession, Attendance, CourseRegistration, Department, sequelize } = require('../models');

// GET /api/reports/dashboard - Lecturer dashboard summary stats
exports.getLecturerDashboardStats = async (req, res) => {
  const lecturerId = req.user.id;

  try {
    // 1. Total Courses taught by the lecturer
    const totalCourses = await Course.count({ where: { lecturerId } });

    // 2. Today's Classes (sessions scheduled for today)
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySessionsCount = await ClassSession.count({
      where: { date: todayStr },
      include: [{ model: Course, as: 'course', where: { lecturerId } }]
    });

    // 3. Unique Students enrolled in the lecturer's courses
    const studentCountResult = await CourseRegistration.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('student_id'))), 'uniqueStudentsCount']
      ],
      include: [{ model: Course, as: 'course', where: { lecturerId }, attributes: [] }]
    });
    const totalStudents = parseInt(studentCountResult?.dataValues?.uniqueStudentsCount || 0, 10);

    // 4. Retrieve all closed sessions and calculate average attendance rate
    const closedSessions = await ClassSession.findAll({
      where: { isActive: false },
      include: [{ model: Course, as: 'course', where: { lecturerId } }]
    });
    const closedSessionIds = closedSessions.map(s => s.id);

    let overallAttendanceRate = 0;
    let studentsAtRiskCount = 0;

    if (closedSessionIds.length > 0) {
      // Find all registrants for these courses to know the max potential attendance
      const totalRegistrations = await CourseRegistration.count({
        include: [{ model: Course, as: 'course', where: { lecturerId } }]
      });

      // Total present entries in these sessions
      const totalPresents = await Attendance.count({
        where: {
          classSessionId: closedSessionIds,
          status: 'present'
        }
      });

      const totalPossibleAttendance = totalRegistrations * closedSessionIds.length;
      overallAttendanceRate = totalPossibleAttendance > 0 ? (totalPresents / totalPossibleAttendance) * 100 : 0;

      // Identify students at risk (< 75% attendance rate) across lecturer's courses
      // We list students, calculate their individual rates, and filter
      const studentRegistrations = await Student.findAll({
        include: [
          {
            model: Course,
            where: { lecturerId },
            through: { attributes: [] }
          }
        ]
      });

      for (const student of studentRegistrations) {
        // Count student's courses taught by this lecturer
        const studentCourseIds = student.Courses.map(c => c.id);
        
        // Find closed sessions for these courses
        const studentClosedSessions = closedSessions.filter(s => studentCourseIds.includes(s.courseId));
        const studentClosedSessionIds = studentClosedSessions.map(s => s.id);

        if (studentClosedSessionIds.length > 0) {
          const studentPresents = await Attendance.count({
            where: {
              studentId: student.id,
              classSessionId: studentClosedSessionIds,
              status: 'present'
            }
          });
          const studentRate = (studentPresents / studentClosedSessionIds.length) * 100;
          if (studentRate < 75) {
            studentsAtRiskCount++;
          }
        }
      }
    }

    return res.status(200).json({
      totalCourses,
      totalStudents,
      todayClasses: todaySessionsCount,
      overallAttendanceRate: parseFloat(overallAttendanceRate.toFixed(1)),
      studentsAtRisk: studentsAtRiskCount
    });

  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/reports/course/:courseId - Get attendance report for a course
exports.getCourseAttendanceReport = async (req, res) => {
  const { courseId } = req.params;

  try {
    const course = await Course.findByPk(courseId, {
      include: [{ model: Department, as: 'department', attributes: ['name'] }]
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.lecturerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not teach this course' });
    }

    // 1. Get closed sessions count (sessions completed)
    const closedSessions = await ClassSession.findAll({
      where: { courseId, isActive: false },
      order: [['date', 'ASC']]
    });
    const totalSessions = closedSessions.length;

    // 2. Fetch all registered students
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
      order: [['fullName', 'ASC']]
    });

    // 3. Compile report rows
    const studentRows = [];
    let below75Count = 0;
    let below60Count = 0;
    let sumPercentage = 0;

    for (const student of enrolledStudents) {
      // Find presence count for this student in the closed sessions of this course
      const attendedCount = await Attendance.count({
        where: {
          studentId: student.id,
          status: 'present'
        },
        include: [
          {
            model: ClassSession,
            as: 'session',
            where: { courseId }
          }
        ]
      });

      const percentage = totalSessions > 0 ? (attendedCount / totalSessions) * 100 : 100;
      sumPercentage += percentage;

      let riskStatus = 'good';
      if (percentage < 60) {
        riskStatus = 'critical';
        below60Count++;
      } else if (percentage < 75) {
        riskStatus = 'at_risk';
        below75Count++;
      }

      studentRows.push({
        id: student.id,
        fullName: student.fullName,
        matricNumber: student.matricNumber,
        department: student.department.name,
        level: student.level,
        email: student.schoolEmail,
        attended: attendedCount,
        total: totalSessions,
        percentage: parseFloat(percentage.toFixed(1)),
        riskStatus
      });
    }

    const averageAttendance = enrolledStudents.length > 0 ? sumPercentage / enrolledStudents.length : 100;

    return res.status(200).json({
      course: {
        id: course.id,
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        department: course.department.name
      },
      stats: {
        totalSessions,
        totalEnrolledStudents: enrolledStudents.length,
        averageAttendance: parseFloat(averageAttendance.toFixed(1)),
        below75Count,
        below60Count
      },
      report: studentRows
    });

  } catch (error) {
    console.error('Error compiling course report:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/reports/course/:courseId/export-csv - Export attendance report as CSV (Excel)
exports.exportCourseReportCSV = async (req, res) => {
  const { courseId } = req.params;

  try {
    const course = await Course.findByPk(courseId);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.lecturerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Reuse the compilation logic
    const closedSessions = await ClassSession.findAll({
      where: { courseId, isActive: false }
    });
    const totalSessions = closedSessions.length;

    const enrolledStudents = await Student.findAll({
      include: [
        { model: Course, where: { id: courseId }, attributes: [], through: { attributes: [] } },
        { model: Department, as: 'department', attributes: ['name'] }
      ],
      order: [['fullName', 'ASC']]
    });

    // Generate CSV Header
    let csvContent = 'Matric Number,Full Name,Department,Level,School Email,Classes Attended,Total Classes,Attendance Percentage,Risk Level\n';

    for (const student of enrolledStudents) {
      const attendedCount = await Attendance.count({
        where: { studentId: student.id, status: 'present' },
        include: [{ model: ClassSession, as: 'session', where: { courseId } }]
      });

      const percentage = totalSessions > 0 ? (attendedCount / totalSessions) * 100 : 100;

      let riskStatus = 'Good';
      if (percentage < 60) {
        riskStatus = 'Critical (<60%)';
      } else if (percentage < 75) {
        riskStatus = 'At Risk (<75%)';
      }

      // Escape quotes and commas in CSV strings
      const escapedName = `"${student.fullName.replace(/"/g, '""')}"`;
      const escapedDept = `"${student.department.name.replace(/"/g, '""')}"`;

      csvContent += `${student.matricNumber},${escapedName},${escapedDept},${student.level},${student.schoolEmail},${attendedCount},${totalSessions},${percentage.toFixed(1)}%,${riskStatus}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Attendance_Report_${course.courseCode}_${new Date().toISOString().split('T')[0]}.csv`);
    
    return res.status(200).send(csvContent);

  } catch (error) {
    console.error('Error exporting CSV:', error);
    return res.status(500).json({ error: 'Internal server error during export' });
  }
};

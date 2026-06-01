const { Course, Student, Department, CourseRegistration, User, sequelize } = require('../models');

// GET /api/courses - List all courses (role-dependent)
exports.listCourses = async (req, res) => {
  try {
    if (req.user.role === 'lecturer') {
      // Lecturers see courses they teach
      const courses = await Course.findAll({
        where: { lecturerId: req.user.id },
        include: [{ model: Department, as: 'department', attributes: ['name', 'faculty'] }]
      });
      return res.status(200).json(courses);
    } else {
      // Students see courses they are enrolled in
      const student = await Student.findOne({ where: { userId: req.user.id } });
      if (!student) {
        return res.status(404).json({ error: 'Student profile not found' });
      }

      const enrolledCourses = await Course.findAll({
        include: [
          {
            model: Student,
            where: { id: student.id },
            attributes: [], // We don't need student details in list
            through: { attributes: [] }
          },
          { model: Department, as: 'department', attributes: ['name', 'faculty'] }
        ]
      });
      return res.status(200).json(enrolledCourses);
    }
  } catch (error) {
    console.error('Error fetching courses:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/courses - Create a new course (Lecturer only)
exports.createCourse = async (req, res) => {
  const { courseCode, courseTitle, departmentId, level } = req.body;

  if (!courseCode || !courseTitle || !departmentId || !level) {
    return res.status(400).json({ error: 'Course code, title, department, and level are required' });
  }

  try {
    const dept = await Department.findByPk(departmentId);
    if (!dept) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const newCourse = await Course.create({
      courseCode,
      courseTitle,
      departmentId,
      level,
      lecturerId: req.user.id
    });

    return res.status(201).json({
      message: 'Course created successfully',
      course: newCourse
    });
  } catch (error) {
    console.error('Error creating course:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: `Course code '${courseCode}' already exists` });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/courses/:id - Course Details
exports.getCourseDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const course = await Course.findByPk(id, {
      include: [
        { model: Department, as: 'department', attributes: ['name', 'faculty'] },
        { model: User, as: 'lecturer', attributes: ['email'] }
      ]
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Access check: Lecturers must teach the course; Students must be enrolled in it
    if (req.user.role === 'lecturer' && course.lecturerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not teach this course' });
    }

    // Get count of registered students
    const totalEnrolled = await CourseRegistration.count({ where: { courseId: id } });

    // Fetch enrolled students list if request is by a lecturer
    let enrolledStudents = [];
    if (req.user.role === 'lecturer') {
      enrolledStudents = await Student.findAll({
        include: [
          {
            model: Course,
            where: { id: course.id },
            attributes: [],
            through: { attributes: [] }
          },
          { model: Department, as: 'department', attributes: ['name'] }
        ],
        attributes: ['id', 'matricNumber', 'fullName', 'level', 'schoolEmail']
      });
    }

    return res.status(200).json({
      course,
      totalEnrolled,
      students: enrolledStudents
    });
  } catch (error) {
    console.error('Error fetching course details:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/courses/:id/enroll - Batch enroll students by matric number (Lecturer only)
exports.enrollStudents = async (req, res) => {
  const { id } = req.params; // Course ID
  const { matricNumbers } = req.body; // Array of matric strings

  if (!matricNumbers || !Array.isArray(matricNumbers) || matricNumbers.length === 0) {
    return res.status(400).json({ error: 'An array of matric numbers is required' });
  }

  try {
    const course = await Course.findByPk(id, {
      include: [{ model: Department, as: 'department', attributes: ['name', 'faculty'] }]
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.lecturerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You do not teach this course' });
    }

    // Find student profiles corresponding to provided matric numbers
    const students = await Student.findAll({
      where: { matricNumber: matricNumbers },
      include: [{ model: Department, as: 'department', attributes: ['name', 'faculty'] }]
    });

    const enrolled = [];
    const errors = [];

    // Loop through matric numbers to process each enrollment request
    for (const matric of matricNumbers) {
      const student = students.find(s => s.matricNumber === matric);

      if (!student) {
        errors.push({ matricNumber: matric, reason: 'Student not found in system database' });
        continue;
      }

      // Check department compatibility (Computing courses restricted to CS, SE, IT)
      // We block student if their department belongs to a different faculty from the course's department faculty
      // e.g. Management Sciences (Accounting) students cannot sign or enroll in Science & Computing courses.
      if (student.department.faculty !== course.department.faculty) {
        errors.push({ 
          matricNumber: matric, 
          reason: `Department restriction: Student department (${student.department.name}) does not belong to faculty (${course.department.faculty})`
        });
        continue;
      }

      try {
        // Create registration record
        await CourseRegistration.create({
          studentId: student.id,
          courseId: course.id
        });
        enrolled.push({ matricNumber: matric, fullName: student.fullName });
      } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
          errors.push({ matricNumber: matric, reason: 'Already enrolled in this course' });
        } else {
          errors.push({ matricNumber: matric, reason: 'Failed to enroll due to server database error' });
        }
      }
    }

    return res.status(200).json({
      message: 'Enrollment processing completed',
      enrolledCount: enrolled.length,
      failedCount: errors.length,
      enrolled,
      failures: errors
    });

  } catch (error) {
    console.error('Error batch enrolling students:', error);
    return res.status(500).json({ error: 'Internal server error during enrollment' });
  }
};

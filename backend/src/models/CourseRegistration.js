const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CourseRegistration = sequelize.define('CourseRegistration', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'student_id',
  },
  courseId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'course_id',
  }
}, {
  tableName: 'course_registrations',
  indexes: [
    {
      unique: true,
      fields: ['student_id', 'course_id']
    }
  ]
});

module.exports = CourseRegistration;

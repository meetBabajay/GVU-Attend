const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  courseCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'course_code',
  },
  courseTitle: {
    type: DataTypes.STRING(150),
    allowNull: false,
    field: 'course_title',
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'department_id',
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isIn: [[100, 200, 300, 400, 500]],
    }
  },
  lecturerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'lecturer_id',
  }
}, {
  tableName: 'courses',
});

module.exports = Course;

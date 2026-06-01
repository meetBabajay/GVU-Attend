const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
  },
  matricNumber: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    field: 'matric_number',
  },
  fullName: {
    type: DataTypes.STRING(150),
    allowNull: false,
    field: 'full_name',
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
  schoolEmail: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    field: 'school_email',
    validate: {
      isEmail: true,
    }
  }
}, {
  tableName: 'students',
});

module.exports = Student;

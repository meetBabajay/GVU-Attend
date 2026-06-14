const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TestScore = sequelize.define('TestScore', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'student_id',
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE'
  },
  courseId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'course_id',
    references: { model: 'courses', key: 'id' },
    onDelete: 'CASCADE'
  },
  score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.0,
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'created_by',
    references: { model: 'users', key: 'id' },
    onDelete: 'RESTRICT'
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'test_scores',
  timestamps: false
});

module.exports = TestScore;

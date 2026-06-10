const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Score = sequelize.define('Score', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: { model: 'users', key: 'id' },
  },
  attendanceCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  assignmentScore: { type: DataTypes.INTEGER, defaultValue: 0 },
  testScore: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'scores',
  timestamps: false,
});

module.exports = Score;

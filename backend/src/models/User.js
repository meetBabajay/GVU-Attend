const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    }
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash',
  },
  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['lecturer', 'student', 'admin']],
    }
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_approved'
  },
  fullName: {
    type: DataTypes.STRING(150),
    allowNull: true,
    field: 'full_name'
  }
}, {
  tableName: 'users',
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('passwordHash') && !user.passwordHash.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
      }
    }
  }
});

// Instance method to check password validity
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const Score = require('./Score');

// Association: each user (student) has one Score record
User.hasOne(Score, { foreignKey: 'userId', as: 'score' });
module.exports = User;

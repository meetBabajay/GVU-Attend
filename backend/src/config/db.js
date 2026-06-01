const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

const dialect = process.env.DB_DIALECT || 'sqlite';

if (dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './database.sqlite',
    logging: false, // Turn off query logs in console, set to console.log to debug
    define: {
      timestamps: true,
      underscored: true // Use snake_case for database fields (created_at, etc.)
    }
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'attendance_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS || 'postgres',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: dialect,
      logging: false,
      define: {
        timestamps: true,
        underscored: true
      },
      dialectOptions: process.env.DB_SSL === 'true' ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      } : {}
    }
  );
}

module.exports = sequelize;

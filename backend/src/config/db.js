const path = require("path");
const { Sequelize } = require("sequelize");

const isVercel = process.env.VERCEL === "1" || !!process.env.VERCEL;
const storagePath = isVercel
  ? "/tmp/database.sqlite"
  : path.join(__dirname, "../../database.sqlite");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: storagePath,
  logging: false,
  define: {
    timestamps: false
  }
});

module.exports = sequelize;
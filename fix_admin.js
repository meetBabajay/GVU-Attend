const bcrypt = require('./backend/node_modules/bcryptjs');
const { Sequelize } = require('./backend/node_modules/sequelize');
const path = require('path');

const db = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'backend/database.sqlite'),
  logging: false
});

(async () => {
  try {
    await db.authenticate();
    console.log('Connected to DB');

    // Check if admin exists
    const [rows] = await db.query("SELECT id, email, role, is_approved, password_hash FROM users WHERE email = 'admin@computing.edu.ng'");
    console.log('Admin row found:', rows.length > 0 ? 'YES' : 'NO');

    if (rows.length === 0) {
      // Create admin user
      const hash = await bcrypt.hash('admin123', 10);
      const { v4: uuidv4 } = require('./backend/node_modules/uuid');
      await db.query(
        "INSERT INTO users (id, email, password_hash, role, is_approved, full_name, created_at, updated_at) VALUES (?, ?, ?, 'admin', 1, 'Portal Administrator', datetime('now'), datetime('now'))",
        { replacements: [uuidv4(), 'admin@computing.edu.ng', hash] }
      );
      console.log('Admin user CREATED');
    } else {
      // Reset password
      const hash = await bcrypt.hash('admin123', 10);
      await db.query(
        "UPDATE users SET password_hash = ?, is_approved = 1 WHERE email = 'admin@computing.edu.ng'",
        { replacements: [hash] }
      );
      console.log('Admin password RESET to admin123');
      console.log('Admin role:', rows[0].role);
      console.log('Admin approved:', rows[0].is_approved);
    }

    // Verify
    const [verify] = await db.query("SELECT id, email, role, is_approved FROM users WHERE email = 'admin@computing.edu.ng'");
    console.log('Verified admin:', JSON.stringify(verify[0]));

    await db.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();

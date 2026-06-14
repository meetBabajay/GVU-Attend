require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { sequelize } = require('../src/models');
const { seedDatabase } = require('../src/db/seedHelper');
(async () => {
  try {
    // Force sync schema (drop tables if they exist)
    await sequelize.sync({ force: true });
    console.log('Database schema sync complete (force).');
    // Run seed helper
    await seedDatabase();
    console.log('Seeding completed.');
    process.exit(0);
  } catch (err) {
    console.error('Migration/seed error:', err);
    process.exit(1);
  }
})();

const { Sequelize } = require('sequelize');

// Explicitly require drivers so Vercel's Node File Trace (@vercel/nft) 
// includes them in the deployed serverless function bundle.
// Sequelize requires these dynamically, which Vercel cannot detect.
try {
  require('sqlite3');
  require('pg');
} catch (e) {
  // Ignore errors if dependencies are missing during local dev
}

// DATABASE_URL from environment (Supabase pooler or any postgres:// URL)
const databaseUrl = process.env.DATABASE_URL;

let sequelize;

if (databaseUrl && databaseUrl.startsWith('postgres')) {
  // Parse connection URL manually so we can pass SSL as constructor options.
  // Using the raw URL string causes pg's URL parser to strip rejectUnauthorized,
  // resulting in "self-signed certificate in certificate chain" errors on the
  // Supabase session-mode pooler.
  const parsed = new URL(databaseUrl);
  const username = decodeURIComponent(parsed.username);
  const password = decodeURIComponent(parsed.password);
  const host     = parsed.hostname;
  const port     = parseInt(parsed.port, 10) || 5432;
  const database = parsed.pathname.replace(/^\//, '') || 'postgres';

  sequelize = new Sequelize(database, username, password, {
    host,
    port,
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {
      // SSL required for Supabase; rejectUnauthorized:false accepts the
      // self-signed cert on the pooler without needing a CA bundle.
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    define: {
      timestamps: false,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else {
  // Local SQLite fallback (also used when DATABASE_URL is absent).
  // On Vercel (read-only FS) write to /tmp.
  const path = require('path');
  const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
  const storagePath = isVercel
    ? '/tmp/database.sqlite'
    : path.join(__dirname, '../../database.sqlite');

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false,
    define: {
      timestamps: false,
    },
  });
}

module.exports = sequelize;
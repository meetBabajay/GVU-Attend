require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
console.log('DATABASE_URL =', process.env.DATABASE_URL);

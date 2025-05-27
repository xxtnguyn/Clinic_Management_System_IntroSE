const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Cấu hình kết nối PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Kiểm tra kết nối
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.stack);
    return;
  }
  console.log('Connected to PostgreSQL database');
  release();
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};

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

// Lấy một client từ pool để thực hiện transaction
const getClient = async () => {
  const client = await pool.connect();
  
  const query = client.query;
  const release = client.release;
  
  // Set a timeout of 5 seconds for queries
  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!');
    console.error(`The last executed query on this client was: ${client.lastQuery}`);
  }, 5000);
  
  // Monkey patch the query method to keep track of the last query executed
  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };
  
  // Override the release method to clear the timeout
  client.release = () => {
    clearTimeout(timeout);
    
    // Reset the query method to its original state
    client.query = query;
    client.release = release;
    
    return release.apply(client);
  };
  
  return client;
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient,
  pool
};

const { Pool } = require('pg');
const pool = new Pool({
            user: 'postgres',
            host: 'localhost',
            database: 'node',
            password: '123456789',
            port: 5432,
          })

//   async function connectToDatabase() {
//     const pool = new Pool({
//         user: 'postgres',
//         host: 'localhost',
//         database: 'node',
//         password: '123456789',
//         port: 5432,
//       })
//     try {
//       await pool.connect();
//       console.log('Connected to PostgreSQL');
//       return pool
//     } catch (err) {
//       console.error('Error connecting to PostgreSQL:', err);
//     }
// }
module.exports = pool;
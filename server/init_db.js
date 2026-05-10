const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.DATABASE_URL;
const dbConfig = dbUrl ? { connectionString: dbUrl } : {
  user: process.env.DB_USER || 'macbook',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'worldcup2026',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
};

async function initDb() {
  const client = new Client({
    ...dbConfig,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  let retries = 5;
  while (retries > 0) {
    try {
      console.log(`Connecting to database to initialize schema... (Retries left: ${retries})`);
      await client.connect();
      
      const schemaPath = path.join(__dirname, 'db.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      console.log('Applying schema from db.sql...');
      await client.query(schema);
      
      console.log('✅ Database initialization complete.');
      await client.end();
      return;
    } catch (err) {
      console.error('❌ Error initializing database:', err.message);
      retries -= 1;
      if (retries === 0) {
        console.error('Could not connect to database after several attempts. Exiting.');
        process.exit(1);
      }
      console.log('Waiting 5 seconds before retrying...');
      await new Promise(res => setTimeout(res, 5000));
    }
  }
}

initDb();

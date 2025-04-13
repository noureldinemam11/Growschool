import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSockets for Neon database
import * as neonConfig from '@neondatabase/serverless';
neonConfig.neonConfig.webSocketConstructor = ws;

const scryptAsync = promisify(scrypt);

// Function to hash password
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminAccount() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const password = '12345678';
  const hashedPassword = await hashPassword(password);
  
  console.log('Creating admin account...');
  
  try {
    // Create admin account with simple password
    const checkRes = await pool.query("SELECT * FROM users WHERE username = $1", ['newadmin']);
        
    if (checkRes.rows.length > 0) {
      console.log(`Admin user already exists, updating password...`);
      const updateRes = await pool.query(
        `UPDATE users SET password = $1 WHERE username = $2 RETURNING id`,
        [hashedPassword, 'newadmin']
      );
      console.log(`Updated admin password (ID: ${updateRes.rows[0].id})`);
    } else {
      // Insert admin user
      const insertRes = await pool.query(
        `INSERT INTO users (username, password, first_name, last_name, role) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        ['newadmin', hashedPassword, 'New', 'Admin', 'admin']
      );
      
      console.log(`Created admin: (ID: ${insertRes.rows[0].id})`);
    }
    
    console.log('Admin username: newadmin');
    console.log('Admin password: 12345678');
  } catch (err) {
    console.error('Error creating admin account:', err);
  } finally {
    await pool.end();
    console.log('Admin creation completed');
  }
}

createAdminAccount().catch(console.error);
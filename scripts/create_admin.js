import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSockets for Neon database
import * as neonConfig from '@neondatabase/serverless';
neonConfig.neonConfig.webSocketConstructor = ws;

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Check if admin user exists
    const checkRes = await pool.query("SELECT * FROM users WHERE username = $1", ['schooladmin']);
    
    if (checkRes.rows.length > 0) {
      console.log('Admin user "schooladmin" already exists');
      return;
    }

    // Hash the password
    const hashedPassword = await hashPassword('Admin123!');
    
    // Insert admin user
    const insertRes = await pool.query(
      `INSERT INTO users (username, password, first_name, last_name, role, email) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      ['schooladmin', hashedPassword, 'School', 'Admin', 'admin', 'admin@school.edu']
    );
    
    console.log(`Created admin user with ID: ${insertRes.rows[0].id}`);
    console.log('Username: schooladmin');
    console.log('Password: Admin123!');
    
  } catch (err) {
    console.error('Error creating admin user:', err);
  } finally {
    await pool.end();
  }
}

createAdminUser().catch(console.error);
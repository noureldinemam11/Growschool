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

// Teacher data - common password for all
const password = '12345678';
const teacherNames = [
  { firstName: 'John', lastName: 'Smith' },
  { firstName: 'Sarah', lastName: 'Johnson' },
  { firstName: 'Michael', lastName: 'Williams' },
  { firstName: 'Emma', lastName: 'Brown' },
  { firstName: 'David', lastName: 'Jones' },
  { firstName: 'Olivia', lastName: 'Miller' },
  { firstName: 'James', lastName: 'Davis' },
  { firstName: 'Sophia', lastName: 'Garcia' },
  { firstName: 'William', lastName: 'Rodriguez' },
  { firstName: 'Ava', lastName: 'Martinez' },
  { firstName: 'Benjamin', lastName: 'Wilson' },
  { firstName: 'Isabella', lastName: 'Anderson' },
  { firstName: 'Alexander', lastName: 'Taylor' },
  { firstName: 'Mia', lastName: 'Thomas' },
  { firstName: 'Ethan', lastName: 'Jackson' },
  { firstName: 'Charlotte', lastName: 'White' },
  { firstName: 'Daniel', lastName: 'Harris' },
  { firstName: 'Amelia', lastName: 'Martin' },
  { firstName: 'Matthew', lastName: 'Thompson' },
  { firstName: 'Harper', lastName: 'Moore' }
];

async function createTeacherAccounts() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const hashedPassword = await hashPassword(password);
  
  console.log('Creating 20 teacher accounts...');
  
  try {
    for (const teacher of teacherNames) {
      // Create username from first name and last name
      const username = `${teacher.firstName.toLowerCase()}${teacher.lastName.toLowerCase()}`;
      
      try {
        // Check if user already exists
        const checkRes = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        
        if (checkRes.rows.length > 0) {
          console.log(`Teacher with username "${username}" already exists, skipping`);
          continue;
        }
        
        // Insert teacher user without email
        const insertRes = await pool.query(
          `INSERT INTO users (username, password, first_name, last_name, role) 
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [username, hashedPassword, teacher.firstName, teacher.lastName, 'teacher']
        );
        
        console.log(`Created teacher: ${teacher.firstName} ${teacher.lastName} (ID: ${insertRes.rows[0].id})`);
      } catch (err) {
        console.error(`Error creating teacher ${teacher.firstName} ${teacher.lastName}:`, err);
      }
    }
  } catch (err) {
    console.error('Error in teacher creation process:', err);
  } finally {
    await pool.end();
    console.log('Teacher creation completed');
  }
}

createTeacherAccounts().catch(console.error);
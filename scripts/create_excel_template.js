import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new workbook
const workbook = xlsx.utils.book_new();

// Sample data with column headers and example rows
const data = [
  {
    firstName: 'John',
    lastName: 'Smith',
    username: 'john.smith',
    email: 'john.smith@school.edu',
    password: 'password123',
    gradeLevel: '6',
    section: 'A',
    houseId: '1'
  },
  {
    firstName: 'Jane',
    lastName: 'Doe',
    username: 'jane.doe',
    email: 'jane.doe@school.edu',
    password: 'password123',
    gradeLevel: '7',
    section: 'B',
    houseId: '2'
  },
  {
    firstName: 'Michael',
    lastName: 'Johnson',
    username: 'michael.j',
    email: 'michael.j@school.edu',
    password: 'password123',
    gradeLevel: '8',
    section: 'C',
    houseId: '3'
  }
];

// Add instructions to the workbook
const instructionsData = [
  ['Student Import Template'],
  [''],
  ['Instructions:'],
  ['1. Fill in the required fields: firstName, lastName, username, email, and password'],
  ['2. Optional fields: gradeLevel, section, and houseId'],
  ['3. Do not modify the column headers in the template sheet'],
  ['4. Save this file as .xlsx or .csv before uploading'],
  ['5. For houseId, use the numeric ID of the house (visible in the Houses management page)'],
  [''],
  ['Notes:'],
  ['- Usernames must be unique'],
  ['- Emails must be valid format and unique'],
  ['- Passwords should be at least 8 characters'],
  [''],
  ['Sample Houses:'],
  ['1 - Phoenix'],
  ['2 - Dragon'],
  ['3 - Griffin'],
  ['4 - Sphinx']
];

// Create a worksheet for instructions
const instructionsSheet = xlsx.utils.aoa_to_sheet(instructionsData);

// Create a worksheet for the template
const templateSheet = xlsx.utils.json_to_sheet(data);

// Add worksheets to the workbook
xlsx.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
xlsx.utils.book_append_sheet(workbook, templateSheet, 'Template');

// Save the file to the client's public directory
const outputPath = path.join(__dirname, '..', 'client', 'public', 'student_import_template.xlsx');
xlsx.writeFile(workbook, outputPath);

console.log(`Excel template created at: ${outputPath}`);
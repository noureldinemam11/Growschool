import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// Create a template for student imports
function createStudentImportTemplate() {
  // Define headers and example data
  const headers = [
    'firstName', 
    'lastName', 
    'username', 
    'email', 
    'password', 
    'gradeLevel', 
    'section', 
    'houseId'
  ];
  
  // Example data
  const exampleData = [
    {
      firstName: 'John',
      lastName: 'Smith',
      username: 'john.smith',
      email: 'john.smith@school.edu',
      password: 'Password123',
      gradeLevel: '9',
      section: 'A',
      houseId: '1'
    },
    {
      firstName: 'Jane',
      lastName: 'Doe',
      username: 'jane.doe',
      email: 'jane.doe@school.edu',
      password: 'Password123',
      gradeLevel: '9',
      section: 'B',
      houseId: '2'
    }
  ];

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(exampleData, { header: headers });
  
  // Add column widths for better readability
  const colWidths = [
    { wch: 15 }, // firstName
    { wch: 15 }, // lastName
    { wch: 20 }, // username
    { wch: 25 }, // email
    { wch: 15 }, // password
    { wch: 10 }, // gradeLevel
    { wch: 10 }, // section
    { wch: 8 }   // houseId
  ];
  
  ws['!cols'] = colWidths;
  
  // Create workbook and add worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  
  // Save to file
  const templatePath = path.resolve('../client/public/student_import_template.xlsx');
  XLSX.writeFile(wb, templatePath);
  
  console.log(`Template created at: ${templatePath}`);
  
  // Create a readme file explaining the template
  const readmePath = path.resolve('../client/public/student_import_readme.txt');
  const readmeContent = `
Student Import Template Instructions
===================================

This template is used to import students into the LiveSchool system.
All columns marked with * are REQUIRED.

Column Descriptions:
-------------------
* firstName: Student's first name (REQUIRED)
* lastName: Student's last name (REQUIRED)
* username: Login username (REQUIRED, must be unique)
* email: Student's email address (REQUIRED, must be unique)
* password: Initial password (will be hashed in the system)
* gradeLevel: Student's grade level (e.g., "9", "10", "11", "12")
* section: Class section or homeroom (e.g., "A", "B", "C")
* houseId: ID of the house the student belongs to (numbers 1-4)
  House IDs:
  1 - Phoenix
  2 - Griffin
  3 - Dragon
  4 - Pegasus

Important Notes:
--------------
1. Do not modify column headers
2. Make sure all required fields are filled in
3. Username and email must be unique across the system
4. Remove the example data before adding your own students
`;

  fs.writeFileSync(readmePath, readmeContent);
  console.log(`Readme created at: ${readmePath}`);
}

createStudentImportTemplate();
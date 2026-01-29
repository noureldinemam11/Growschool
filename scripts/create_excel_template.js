import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

async function createStudentImportTemplate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Students');
  
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

  worksheet.columns = [
    { header: 'firstName', key: 'firstName', width: 15 },
    { header: 'lastName', key: 'lastName', width: 15 },
    { header: 'username', key: 'username', width: 20 },
    { header: 'email', key: 'email', width: 25 },
    { header: 'password', key: 'password', width: 15 },
    { header: 'gradeLevel', key: 'gradeLevel', width: 10 },
    { header: 'section', key: 'section', width: 10 },
    { header: 'houseId', key: 'houseId', width: 8 }
  ];
  
  exampleData.forEach(data => {
    worksheet.addRow(data);
  });
  
  const templatePath = path.resolve('../client/public/student_import_template.xlsx');
  await workbook.xlsx.writeFile(templatePath);
  
  console.log(`Template created at: ${templatePath}`);
  
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

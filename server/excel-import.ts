import * as XLSX from 'xlsx';
import multer from 'multer';
import { Express, Request, Response } from 'express';
import { storage as appStorage } from './storage';
import { z } from 'zod';
import { InsertUser, UserRole } from '@shared/schema';

// Create type for Request with the multer file property
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Set up multer storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const filetypes = /xlsx|xls|csv/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      file.originalname.toLowerCase().split('.').pop() || ''
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error('File upload only supports Excel or CSV files'));
  },
});

// Student schema for validation
const studentImportSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.literal("student"), // Only allow student role for Excel imports
  gradeLevel: z.string().optional().nullable(),
  section: z.string().optional().nullable(),
  houseId: z.number().optional().nullable(),
});

type StudentImport = z.infer<typeof studentImportSchema>;

export function setupExcelImport(app: Express) {
  const uploadMiddleware = upload.single('file');

  app.post('/api/import/students', (req: Request, res: Response) => {
    // Check authentication
    if (!req.isAuthenticated() || !['admin', 'teacher'].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    uploadMiddleware(req, res, async (err: any) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      const multerReq = req as MulterRequest;
      if (!multerReq.file) {
        return res.status(400).json({ error: "Please upload a file" });
      }

      try {
        const workbook = XLSX.read(multerReq.file.buffer);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Import results tracking
        const results = {
          total: data.length,
          imported: 0,
          failed: 0,
          errors: [] as { row: number; message: string }[],
        };

        // Process each row
        for (let i = 0; i < data.length; i++) {
          const row = data[i] as any;
          
          try {
            // Map Excel column names to our schema
            const student: StudentImport = {
              firstName: row.firstName || row['First Name'] || row['first_name'] || '',
              lastName: row.lastName || row['Last Name'] || row['last_name'] || '',
              username: row.username || row.Username || row.user_name || '',
              email: row.email || row.Email || '',
              password: row.password || row.Password || 'password123', // Default password
              role: 'student', // Fixed as student role
              gradeLevel: row.gradeLevel || row['Grade Level'] || row.grade || null,
              section: row.section || row.Section || null,
              houseId: Number(row.houseId || row['House ID']) || null,
            };

            // Validate student data
            const validatedData = studentImportSchema.parse(student);
            
            // Check if username already exists
            const existingUser = await appStorage.getUserByUsername(validatedData.username);
            if (existingUser) {
              throw new Error(`Username '${validatedData.username}' already exists`);
            }
            
            // Create the student
            await appStorage.createUser(validatedData);
            results.imported++;
          } catch (error) {
            results.failed++;
            results.errors.push({
              row: i + 1, // +1 because spreadsheets are 1-indexed for users
              message: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        res.status(200).json({
          message: `Imported ${results.imported} of ${results.total} students`,
          results
        });
      } catch (error) {
        res.status(500).json({
          error: 'Failed to process the Excel file',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  });
}
import * as XLSX from 'xlsx';
import multer from 'multer';
import { Express, Request, Response } from 'express';
import { storage as appStorage } from './storage';
import { z } from 'zod';

// Interface for multer request
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Set up multer storage configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Log file upload information for debugging
    console.log(`Upload attempt - Filename: ${file.originalname}, Mimetype: ${file.mimetype}`);
    
    // Accept various file types that might be Excel/CSV files
    const fileExtension = file.originalname.toLowerCase().split('.').pop() || '';
    const validExtensions = ['xlsx', 'xls', 'csv'];
    
    if (validExtensions.includes(fileExtension) || 
        file.mimetype.includes('excel') || 
        file.mimetype.includes('spreadsheet') || 
        file.mimetype.includes('csv') || 
        file.mimetype === 'text/plain' || 
        file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error(`File upload only supports Excel (.xlsx, .xls) or CSV files. Received: ${fileExtension}, mimetype: ${file.mimetype}`));
    }
  }
});

// Student data schema for validation
const studentDataSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.literal("student"),
  gradeLevel: z.string().nullable().optional(),
  section: z.string().nullable().optional(),
  houseId: z.number().nullable().optional()
});

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
        // Read the Excel/CSV file
        const workbook = XLSX.read(multerReq.file.buffer, {
          type: 'buffer',
          cellDates: true,
          cellNF: false,
          cellText: false
        });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          return res.status(400).json({ error: 'Invalid file format: No worksheets found' });
        }
        
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!worksheet) {
          return res.status(400).json({ error: 'Invalid file format: Worksheet is empty' });
        }
        
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Track import results
        const results = {
          total: data.length,
          imported: 0,
          failed: 0,
          errors: [] as { row: number; message: string }[]
        };

        // Process each row
        for (let i = 0; i < data.length; i++) {
          const row = data[i] as any;
          
          try {
            // Extract values from row (supporting different column naming conventions)
            const extractedData = {
              firstName: String(row.firstName || row['First Name'] || row['first_name'] || ''),
              lastName: String(row.lastName || row['Last Name'] || row['last_name'] || ''),
              username: String(row.username || row.Username || row.user_name || ''),
              email: String(row.email || row.Email || ''),
              password: String(row.password || row.Password || 'password123'),
              role: 'student' as const,
              gradeLevel: row.gradeLevel || row['Grade Level'] || row.grade || null,
              section: row.section || row.Section || null,
              houseId: row.houseId || row['House ID'] ? Number(row.houseId || row['House ID']) : null
            };

            // Basic validation
            if (!extractedData.firstName || !extractedData.lastName || !extractedData.username || !extractedData.email) {
              throw new Error('Missing required fields (firstName, lastName, username, or email)');
            }

            // Validate with Zod schema
            const validData = studentDataSchema.parse(extractedData);
            
            // Check if username already exists
            const existingUser = await appStorage.getUserByUsername(validData.username);
            if (existingUser) {
              throw new Error(`Username '${validData.username}' already exists`);
            }

            // Create user with required confirmPassword field
            const userToCreate = {
              ...validData,
              confirmPassword: validData.password // Add confirmPassword field
            };
            
            await appStorage.createUser(userToCreate);
            results.imported++;
          } catch (error) {
            results.failed++;
            results.errors.push({
              row: i + 1, // +1 because spreadsheets are 1-indexed for users
              message: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        res.status(200).json({
          message: `Successfully imported ${results.imported} of ${results.total} students`,
          results
        });
      } catch (error) {
        console.error('Excel import error:', error);
        res.status(500).json({
          error: 'Failed to process the file',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  });
}
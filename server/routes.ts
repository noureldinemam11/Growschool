import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from "path";
import { setupAuth } from "./auth";
import { setupExcelImport } from "./excel-import";
import { storage } from "./storage";
import { pool } from "./db";
import { insertBehaviorPointSchema, insertRewardRedemptionSchema, userRoles } from "@shared/schema";
import { z } from "zod";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from client/public directory
  app.use(express.static(path.join(__dirname, "..", "client", "public")));
  
  // Setup authentication routes
  setupAuth(app);
  
  // Setup Excel import functionality
  setupExcelImport(app);

  // Houses
  app.get("/api/houses", async (req, res) => {
    try {
      const houses = await storage.getAllHouses();
      res.json(houses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch houses" });
    }
  });

  app.get("/api/houses/:id", async (req, res) => {
    try {
      const house = await storage.getHouse(Number(req.params.id));
      if (!house) {
        return res.status(404).json({ error: "House not found" });
      }
      res.json(house);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch house" });
    }
  });
  
  app.post("/api/houses", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const house = await storage.createHouse(req.body);
      res.status(201)
        .header('Content-Type', 'application/json')
        .json(house);
    } catch (error) {
      console.error("Error creating house:", error);
      res.status(500).json({ error: "Failed to create house" });
    }
  });

  app.patch("/api/houses/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const houseId = Number(req.params.id);
      console.log(`[DEBUG] PATCH /api/houses/${houseId} received with body:`, req.body);
      
      const house = await storage.getHouse(houseId);
      console.log(`[DEBUG] Current house state:`, house);
      
      if (!house) {
        return res.status(404).json({ error: "House not found" });
      }
      
      // Directly execute SQL update for debugging
      try {
        // Create direct query to the database with a fresh connection
        const connection = await pool.connect();
        let queryResult;
        try {
          await connection.query('BEGIN');
          queryResult = await connection.query(
            `UPDATE houses SET name = $1, color = $2, description = $3, logo_url = $4 WHERE id = $5 RETURNING *`,
            [
              req.body.name || house.name,
              req.body.color || house.color,
              req.body.description || house.description,
              req.body.logoUrl || house.logoUrl,
              houseId
            ]
          );
          await connection.query('COMMIT');
          console.log(`[DEBUG] Manual transaction committed successfully`);
        } catch (txError) {
          await connection.query('ROLLBACK');
          console.error(`[DEBUG] Manual transaction rolled back due to error:`, txError);
          throw txError;
        } finally {
          connection.release();
        }
        
        console.log(`[DEBUG] Direct SQL update result:`, queryResult?.rows?.[0]);
        
        // Still try the ORM method for comparison
        const updatedHouse = await storage.updateHouse(houseId, req.body);
        console.log(`[DEBUG] ORM update result:`, updatedHouse);
        
        if (!updatedHouse) {
          return res.status(500).json({ error: "Failed to update house" });
        }
        
        // Fetch the house again to verify update
        const verifiedHouse = await storage.getHouse(houseId);
        console.log(`[DEBUG] Verified house state after update:`, verifiedHouse);
        
        // Ensure we're returning a valid JSON response with explicit content type
        return res
          .status(200)
          .setHeader('Content-Type', 'application/json')
          .send(JSON.stringify({ 
            success: true,
            house: verifiedHouse || updatedHouse 
          }));
      } catch (sqlError) {
        console.error("SQL update error:", sqlError);
        throw sqlError; // Re-throw to be caught by the outer catch block
      }
    } catch (error) {
      console.error("Error updating house:", error);
      return res.status(500).json({ 
        error: "Failed to update house",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.delete("/api/houses/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const houseId = Number(req.params.id);
      const house = await storage.getHouse(houseId);
      
      if (!house) {
        return res.status(404).json({ error: "House not found" });
      }
      
      // Check if there are students assigned to this house
      const studentsInHouse = await storage.getStudentsByHouseId(houseId);
      if (studentsInHouse.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete house with assigned students. Please reassign students first." 
        });
      }
      
      // Use a direct transaction for more control
      const connection = await pool.connect();
      let deleteResult;
      
      try {
        await connection.query('BEGIN');
        deleteResult = await connection.query(
          'DELETE FROM houses WHERE id = $1 RETURNING *',
          [houseId]
        );
        await connection.query('COMMIT');
        console.log(`[DEBUG] House delete transaction committed successfully`);
      } catch (txError) {
        await connection.query('ROLLBACK');
        console.error(`[DEBUG] House delete transaction rolled back due to error:`, txError);
        throw txError;
      } finally {
        connection.release();
      }
      
      if (!deleteResult?.rows?.length) {
        return res.status(500).json({ error: "Failed to delete house" });
      }
      
      console.log(`[DEBUG] House deleted successfully:`, deleteResult.rows[0]);
      
      res.status(200)
        .setHeader('Content-Type', 'application/json')
        .send(JSON.stringify({ success: true, message: "House deleted successfully" }));
    } catch (error) {
      console.error("Error deleting house:", error);
      res.status(500).json({ error: "Failed to delete house" });
    }
  });

  // Behavior Categories
  app.get("/api/behavior-categories", async (req, res) => {
    try {
      const categories = await storage.getAllBehaviorCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch behavior categories" });
    }
  });

  // Behavior Points
  app.post("/api/behavior-points", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const validatedData = insertBehaviorPointSchema.parse(req.body);
      const behaviorPoint = await storage.createBehaviorPoint(validatedData);
      res.status(201).json(behaviorPoint);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create behavior point" });
    }
  });

  app.get("/api/behavior-points/student/:studentId", async (req, res) => {
    try {
      const studentId = Number(req.params.studentId);
      
      // Check authorization: must be admin, teacher, the student, or the student's parent
      if (req.isAuthenticated()) {
        const user = req.user;
        if (
          user.role === "admin" || 
          user.role === "teacher" || 
          (user.role === "student" && user.id === studentId) ||
          (user.role === "parent" && (await storage.getStudentsByParentId(user.id)).some(s => s.id === studentId))
        ) {
          const points = await storage.getBehaviorPointsByStudentId(studentId);
          return res.json(points);
        }
      }
      
      return res.status(403).json({ error: "Unauthorized" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch behavior points" });
    }
  });
  
  // New endpoint to get student's points balance
  app.get("/api/students/:studentId/points-balance", async (req, res) => {
    try {
      const studentId = Number(req.params.studentId);
      
      // Check authorization: must be admin, teacher, the student, or the student's parent
      if (req.isAuthenticated()) {
        const user = req.user;
        if (
          user.role === "admin" || 
          user.role === "teacher" || 
          (user.role === "student" && user.id === studentId) ||
          (user.role === "parent" && (await storage.getStudentsByParentId(user.id)).some(s => s.id === studentId))
        ) {
          // Get all behavior points
          const points = await storage.getBehaviorPointsByStudentId(studentId);
          const earnedPoints = points.reduce((sum, point) => sum + point.points, 0);
          
          // Get all redemptions
          const redemptions = await storage.getRewardRedemptionsByStudentId(studentId);
          const spentPoints = redemptions.reduce((sum, redemption) => sum + redemption.pointsSpent, 0);
          
          // Calculate balance
          const balance = earnedPoints - spentPoints;
          
          return res.json({
            studentId,
            earned: earnedPoints,
            spent: spentPoints,
            balance: balance
          });
        }
      }
      
      return res.status(403).json({ error: "Unauthorized" });
    } catch (error) {
      console.error("Error getting points balance:", error);
      res.status(500).json({ error: "Failed to fetch points balance" });
    }
  });

  app.get("/api/behavior-points/teacher/:teacherId", async (req, res) => {
    try {
      const teacherId = Number(req.params.teacherId);
      
      // Check authorization: must be admin or the teacher
      if (req.isAuthenticated()) {
        const user = req.user;
        if (user.role === "admin" || (user.role === "teacher" && user.id === teacherId)) {
          const points = await storage.getBehaviorPointsByTeacherId(teacherId);
          return res.json(points);
        }
      }
      
      return res.status(403).json({ error: "Unauthorized" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch behavior points" });
    }
  });

  app.get("/api/behavior-points/recent", async (req, res) => {
    try {
      const limit = Number(req.query.limit) || 10;
      const points = await storage.getRecentBehaviorPoints(limit);
      
      // Fetch related data for the response
      const enrichedPoints = await Promise.all(points.map(async (point) => {
        const student = await storage.getUser(point.studentId);
        const teacher = await storage.getUser(point.teacherId);
        const category = await storage.getBehaviorCategory(point.categoryId);
        
        return {
          ...point,
          student: student ? {
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            gradeLevel: student.gradeLevel,
            section: student.section
          } : null,
          teacher: teacher ? {
            id: teacher.id,
            firstName: teacher.firstName,
            lastName: teacher.lastName
          } : null,
          category: category
        };
      }));
      
      res.json(enrichedPoints);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent behavior points" });
    }
  });

  // Rewards
  app.get("/api/rewards", async (req, res) => {
    try {
      const rewards = await storage.getAllRewards();
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rewards" });
    }
  });

  app.post("/api/rewards/redeem", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "student") {
      return res.status(403).json({ error: "Only students can redeem rewards" });
    }

    try {
      const validatedData = insertRewardRedemptionSchema.parse({
        ...req.body,
        studentId: req.user.id
      });
      
      // Check if student has enough points
      const studentPoints = await storage.getBehaviorPointsByStudentId(req.user.id);
      const totalPoints = studentPoints.reduce((sum, point) => sum + point.points, 0);
      
      const reward = await storage.getReward(validatedData.rewardId);
      if (!reward) {
        return res.status(404).json({ error: "Reward not found" });
      }
      
      if (totalPoints < reward.pointCost) {
        return res.status(400).json({ error: "Not enough points to redeem this reward" });
      }
      
      if (reward.quantity <= 0) {
        return res.status(400).json({ error: "This reward is out of stock" });
      }
      
      const redemption = await storage.createRewardRedemption({
        ...validatedData,
        pointsSpent: reward.pointCost
      });
      
      res.status(201).json(redemption);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to redeem reward" });
    }
  });
  
  // Endpoint for teachers/admins to redeem rewards on behalf of students
  app.post("/api/rewards/redeem-for-student", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({ error: "Only admins and teachers can redeem rewards for students" });
    }

    try {
      // Validate the request data
      const redeemSchema = z.object({
        rewardId: z.number(),
        studentId: z.number(),
        awardedById: z.number()
      });
      
      const validatedData = redeemSchema.parse(req.body);
      
      // Check if student exists
      const student = await storage.getUser(validatedData.studentId);
      if (!student || student.role !== "student") {
        return res.status(404).json({ error: "Student not found" });
      }
      
      // Check if student has enough points
      const studentPoints = await storage.getBehaviorPointsByStudentId(validatedData.studentId);
      const totalPoints = studentPoints.reduce((sum, point) => sum + point.points, 0);
      
      // Get all redemptions
      const redemptions = await storage.getRewardRedemptionsByStudentId(validatedData.studentId);
      const spentPoints = redemptions.reduce((sum, redemption) => sum + redemption.pointsSpent, 0);
      
      // Calculate balance
      const balance = totalPoints - spentPoints;
      
      const reward = await storage.getReward(validatedData.rewardId);
      if (!reward) {
        return res.status(404).json({ error: "Reward not found" });
      }
      
      if (balance < reward.pointCost) {
        return res.status(400).json({ error: "Student does not have enough points to redeem this reward" });
      }
      
      if (reward.quantity <= 0) {
        return res.status(400).json({ error: "This reward is out of stock" });
      }
      
      // Create redemption record with approved status
      // We need to typecast here since the insertRewardRedemptionSchema doesn't include status
      const redemptionData = {
        rewardId: validatedData.rewardId,
        studentId: validatedData.studentId, 
        pointsSpent: reward.pointCost
      };
      
      // First create the redemption
      const redemption = await storage.createRewardRedemption(redemptionData);
      
      // Then update its status to approved (this would be typically handled by admin approval)
      const updatedRedemption = await storage.updateRewardRedemptionStatus(redemption.id, "approved");
      
      // Update the reward quantity
      await storage.updateReward(reward.id, { 
        quantity: reward.quantity - 1 
      });
      
      // Ensure we're returning a valid JSON response with proper format
      return res.status(201).json({ 
        success: true,
        redemption: updatedRedemption || redemption
      });
    } catch (error) {
      console.error("Redemption error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        error: "Failed to redeem reward for student" 
      });
    }
  });

  app.get("/api/rewards/redemptions/student/:studentId", async (req, res) => {
    try {
      const studentId = Number(req.params.studentId);
      
      // Check authorization
      if (req.isAuthenticated()) {
        const user = req.user;
        if (
          user.role === "admin" || 
          user.role === "teacher" || 
          (user.role === "student" && user.id === studentId) ||
          (user.role === "parent" && (await storage.getStudentsByParentId(user.id)).some(s => s.id === studentId))
        ) {
          const redemptions = await storage.getRewardRedemptionsByStudentId(studentId);
          
          // Enrich with reward data
          const enrichedRedemptions = await Promise.all(redemptions.map(async (redemption) => {
            const reward = await storage.getReward(redemption.rewardId);
            return {
              ...redemption,
              reward: reward
            };
          }));
          
          return res.json(enrichedRedemptions);
        }
      }
      
      return res.status(403).json({ error: "Unauthorized" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reward redemptions" });
    }
  });

  // Users
  app.get("/api/users/role/:role", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const { role } = req.params;
      if (!userRoles.includes(role as any)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      
      const users = await storage.getUsersByRole(role);
      
      // Only return necessary fields for security
      const safeUsers = users.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role,
        gradeLevel: user.gradeLevel,
        section: user.section,
        houseId: user.houseId
      }));
      
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/students/house/:houseId", async (req, res) => {
    try {
      const houseId = Number(req.params.houseId);
      const students = await storage.getStudentsByHouseId(houseId);
      
      // Only return necessary fields for security
      const safeStudents = students.map(student => ({
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        gradeLevel: student.gradeLevel,
        section: student.section,
        houseId: student.houseId
      }));
      
      res.json(safeStudents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.get("/api/users/students/parent/:parentId", async (req, res) => {
    try {
      const parentId = Number(req.params.parentId);
      
      // Check authorization: must be admin, teacher, or the parent
      if (req.isAuthenticated()) {
        const user = req.user;
        if (user.role === "admin" || user.role === "teacher" || (user.role === "parent" && user.id === parentId)) {
          const students = await storage.getStudentsByParentId(parentId);
          
          // Only return necessary fields for security
          const safeStudents = students.map(student => ({
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            gradeLevel: student.gradeLevel,
            section: student.section,
            houseId: student.houseId
          }));
          
          return res.json(safeStudents);
        }
      }
      
      return res.status(403).json({ error: "Unauthorized" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  // New endpoints for student roster management
  app.get("/api/users/students", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const students = await storage.getUsersByRole("student");
      
      // Only return necessary fields for security
      const safeStudents = students.map(student => ({
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        username: student.username,
        email: student.email,
        gradeLevel: student.gradeLevel,
        section: student.section,
        houseId: student.houseId
      }));
      
      res.json(safeStudents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students roster" });
    }
  });

  app.patch("/api/users/students/:studentId/roster", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const studentId = Number(req.params.studentId);
      const { gradeLevel, section, houseId } = req.body;
      
      // Validate the data
      const updateSchema = z.object({
        gradeLevel: z.string().optional(),
        section: z.string().optional(),
        houseId: z.number().nullable().optional(),
      });
      
      const validatedData = updateSchema.parse(req.body);
      
      // Update the student
      const updatedStudent = await storage.updateUser(studentId, validatedData);
      
      if (!updatedStudent) {
        return res.status(404).json({ error: "Student not found" });
      }
      
      // Return only necessary fields
      const safeStudent = {
        id: updatedStudent.id,
        firstName: updatedStudent.firstName,
        lastName: updatedStudent.lastName,
        gradeLevel: updatedStudent.gradeLevel,
        section: updatedStudent.section,
        houseId: updatedStudent.houseId
      };
      
      res.json(safeStudent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update student roster assignment" });
    }
  });

  // Bulk import students
  // Add a dedicated endpoint for adding a single user
  app.post("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      console.log("POST /api/users - Request body:", req.body);
      
      // Validate role
      if (!userRoles.includes(req.body.role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      
      // Create the user
      const newUser = await storage.createUser(req.body);
      console.log("User created successfully:", newUser);
      
      return res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: "Failed to create user" });
    }
  });
  
  // Add a DELETE endpoint for users
  app.delete("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const userId = Number(req.params.id);
      console.log(`DELETE /api/users/${userId} - Attempting to delete user`);
      
      // Check if user exists and is a student
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // For safety, only allow deletion of student accounts
      if (user.role !== "student") {
        return res.status(403).json({ error: "Can only delete student accounts" });
      }
      
      // Check if there are any behavior points or reward redemptions for this student
      const behaviorPoints = await storage.getBehaviorPointsByStudentId(userId);
      if (behaviorPoints.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete student with behavior points. Please remove the points first." 
        });
      }
      
      const redemptions = await storage.getRewardRedemptionsByStudentId(userId);
      if (redemptions.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete student with reward redemptions. Please remove the redemptions first." 
        });
      }
      
      // Delete the user
      const result = await storage.deleteUser(userId);
      if (!result) {
        return res.status(500).json({ error: "Failed to delete user" });
      }
      
      console.log(`User ${userId} deleted successfully`);
      return res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(500).json({ 
        error: "Failed to delete user",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/users/bulk-import", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const { students } = req.body;
      if (!Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ error: "No students provided for import" });
      }

      const results = [];
      const errors = [];

      for (const studentData of students) {
        try {
          // Generate a username but student accounts won't use it for login
          // This is just to satisfy database requirements
          const username = `${studentData.firstName.toLowerCase().replace(/\s+/g, '')}${studentData.lastName.toLowerCase().replace(/\s+/g, '')}`;
          
          // Create user with role explicitly set to student
          const userData = {
            ...studentData,
            username,
            password: 'no-login-required', // Students won't log in
            role: 'student'
          };

          const student = await storage.createUser(userData);
          results.push(student);
        } catch (err) {
          console.error(`Error importing student: ${JSON.stringify(studentData)}`, err);
          errors.push({
            student: `${studentData.firstName} ${studentData.lastName}`,
            error: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      }

      // If some students were successfully imported but others failed
      if (results.length > 0 && errors.length > 0) {
        return res.status(207).json({ 
          success: true, 
          message: `Imported ${results.length} students with ${errors.length} errors`,
          students: results,
          errors
        });
      }
      
      // If all students were successfully imported
      if (results.length > 0) {
        return res.status(201).json({ 
          success: true, 
          message: `Successfully imported ${results.length} students`,
          students: results
        });
      }
      
      // If all imports failed
      return res.status(400).json({ 
        success: false, 
        message: 'Failed to import any students',
        errors
      });
    } catch (error) {
      console.error("Error bulk importing students:", error);
      res.status(500).json({ 
        error: "Failed to import students",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

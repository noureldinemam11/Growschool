import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from "path";
import { setupAuth } from "./auth";
import { setupExcelImport } from "./excel-import";
import { storage } from "./storage";
import { db, pool } from "./db";
import { insertBehaviorPointSchema, insertRewardRedemptionSchema, userRoles, users } from "@shared/schema";
import { z } from "zod";
import { fileURLToPath } from "url";
import { eq } from "drizzle-orm";

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
  
  app.post("/api/behavior-categories", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create behavior categories" });
    }
    
    try {
      const category = await storage.createBehaviorCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating behavior category:", error);
      res.status(500).json({ error: "Failed to create behavior category" });
    }
  });
  
  app.patch("/api/behavior-categories/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can update behavior categories" });
    }
    
    try {
      const categoryId = Number(req.params.id);
      const category = await storage.getBehaviorCategory(categoryId);
      
      if (!category) {
        return res.status(404).json({ error: "Behavior category not found" });
      }
      
      // Update the category - implement updateBehaviorCategory in storage
      const updatedCategory = await storage.updateBehaviorCategory(categoryId, req.body);
      
      if (!updatedCategory) {
        return res.status(500).json({ error: "Failed to update behavior category" });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating behavior category:", error);
      res.status(500).json({ error: "Failed to update behavior category" });
    }
  });
  
  app.delete("/api/behavior-categories/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can delete behavior categories" });
    }
    
    try {
      const categoryId = Number(req.params.id);
      const category = await storage.getBehaviorCategory(categoryId);
      
      if (!category) {
        return res.status(404).json({ error: "Behavior category not found" });
      }
      
      // Check if this category is used in behavior points
      const pointsWithCategory = await storage.getBehaviorPointsByCategoryId(categoryId);
      
      if (pointsWithCategory.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete category that is being used in behavior points. Please reassign these points first." 
        });
      }
      
      // Delete the category - implement deleteBehaviorCategory in storage
      const deleted = await storage.deleteBehaviorCategory(categoryId);
      
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete behavior category" });
      }
      
      res.json({ success: true, message: "Behavior category deleted successfully" });
    } catch (error) {
      console.error("Error deleting behavior category:", error);
      res.status(500).json({ error: "Failed to delete behavior category" });
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
        let student = null;
        let teacher = null;
        
        // Make sure IDs are valid numbers before querying
        if (!isNaN(point.studentId)) {
          student = await storage.getUser(point.studentId);
        } else {
          console.warn(`Invalid student ID in behavior point: ${point.id}, studentId: ${point.studentId}`);
        }
        
        if (!isNaN(point.teacherId)) {
          teacher = await storage.getUser(point.teacherId);
        } else {
          console.warn(`Invalid teacher ID in behavior point: ${point.id}, teacherId: ${point.teacherId}`);
        }
        
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
    } catch (error: any) {
      console.error("Error fetching recent behavior points:", error.message || 'Unknown error', error.stack);
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
      
      // Validate student ID is a valid number before querying database
      if (isNaN(validatedData.studentId)) {
        return res.status(400).json({ error: "Invalid student ID format" });
      }
      
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
  
  // Get a specific user by ID
  app.get("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const userId = Number(req.params.id);
      
      // Check if userId is a valid number
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Only admins and teachers can view any user, others can only view themselves
      const currentUser = req.user;
      if (currentUser.role !== "admin" && currentUser.role !== "teacher" && currentUser.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Return safe user data
      const safeUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        email: user.email,
        gradeLevel: user.gradeLevel,
        section: user.section,
        houseId: user.houseId
      };
      
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/users/students/house/:houseId", async (req, res) => {
    try {
      const houseId = Number(req.params.houseId);
      
      // Check if houseId is a valid number
      if (isNaN(houseId)) {
        return res.status(400).json({ error: "Invalid house ID" });
      }
      
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
      
      // Check if parentId is a valid number
      if (isNaN(parentId)) {
        return res.status(400).json({ error: "Invalid parent ID" });
      }
      
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

  // Endpoint to get all students for the roster management
  app.get("/api/users/students", async (req, res) => {
    try {
      // Check authentication first without trying to access user properties
      if (!req.isAuthenticated()) {
        return res.status(403).json({ error: "Unauthorized - Authentication required" });
      }
      
      // Now safely check the user role after confirming authentication
      const user = req.user;
      if (!user || !["admin", "teacher"].includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized - Insufficient permissions" });
      }

      console.log("Fetching students roster for user:", user.id, user.username, user.role);
      
      // Use direct database query with explicit column selection
      const result = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          email: users.email,
          gradeLevel: users.gradeLevel,
          section: users.section,
          houseId: users.houseId
        })
        .from(users)
        .where(eq(users.role, "student"));
      
      if (!result || !Array.isArray(result)) {
        console.error("Unexpected result format from database query:", result);
        throw new Error("Failed to retrieve student data");
      }
      
      console.log(`Retrieved ${result.length} students`);
      return res.json(result);
    } catch (error: any) {
      console.error("Error fetching student roster:", error.message || 'Unknown error', error.stack);
      return res.status(500).json({ error: "Failed to fetch students roster" });
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
      
      // Check if userId is a valid number
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      console.log(`DELETE /api/users/${userId} - Attempting to delete user with associated records`);
      
      // Check if user exists and is a student
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // For safety, only allow deletion of student accounts
      if (user.role !== "student") {
        return res.status(403).json({ error: "Can only delete student accounts" });
      }
      
      // Use direct SQL queries to delete associated records, bypassing ORM and foreign key constraints
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        console.log(`Transaction started for deletion of user ${userId}`);
        
        // Step 1: Delete behavior points for this student
        console.log(`Deleting behavior points for student ${userId}`);
        const bpResult = await client.query(
          'DELETE FROM behavior_points WHERE student_id = $1',
          [userId]
        );
        console.log(`Deleted ${bpResult.rowCount} behavior points`);
        
        // Step 2: Delete reward redemptions for this student
        console.log(`Deleting reward redemptions for student ${userId}`);
        const rrResult = await client.query(
          'DELETE FROM reward_redemptions WHERE student_id = $1',
          [userId]
        );
        console.log(`Deleted ${rrResult.rowCount} reward redemptions`);
        
        // Step 3: Finally, delete the user
        console.log(`Deleting user ${userId}`);
        const userResult = await client.query(
          'DELETE FROM users WHERE id = $1',
          [userId]
        );
        
        if (userResult.rowCount === 0) {
          console.error(`No user deleted with id ${userId}`);
          throw new Error(`Failed to delete user ${userId}`);
        }
        
        console.log(`Deleted user ${userId} successfully`);
        
        // Step 4: Commit the transaction
        await client.query('COMMIT');
        console.log(`Transaction committed successfully`);
        
        return res.status(200).json({ 
          success: true, 
          message: "User deleted successfully",
          details: {
            behaviorPointsDeleted: bpResult.rowCount,
            rewardRedemptionsDeleted: rrResult.rowCount
          }
        });
      } catch (txError: any) {
        // Roll back the transaction if any step fails
        await client.query('ROLLBACK');
        console.error(`Transaction rolled back: ${txError.message || 'Unknown error'}`);
        
        return res.status(500).json({
          error: "Failed to delete user",
          details: txError.message || "Unknown database error",
        });
      } finally {
        // Always release the client
        client.release();
        console.log(`Database client released`);
      }
    } catch (error: any) {
      console.error("Error deleting user:", error);
      return res.status(500).json({ 
        error: "Failed to delete user",
        details: error.message || "Unknown error"
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

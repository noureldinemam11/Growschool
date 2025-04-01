import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from "path";
import { setupAuth } from "./auth";
import { setupExcelImport } from "./excel-import";
import { storage } from "./storage";
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

  const httpServer = createServer(app);

  return httpServer;
}

import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from "path";
import { setupAuth, comparePasswords, hashPassword } from "./auth";
import { setupExcelImport } from "./excel-import";
import { storage } from "./storage";
import { db, pool } from "./db";
import { insertBehaviorPointSchema, insertRewardRedemptionSchema, userRoles, users, User, 
  insertPodSchema, insertClassSchema } from "@shared/schema";
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

  // Houses - Deprecated (replaced by Pods) 
  // but keeping endpoint for backwards compatibility
  app.get("/api/houses", async (req, res) => {
    try {
      // Redirect to the pods endpoint
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch houses" });
    }
  });

  // Pods
  app.get("/api/pods", async (req, res) => {
    try {
      const pods = await storage.getAllPods();
      res.json(pods);
    } catch (error) {
      console.error("Error fetching pods:", error);
      res.status(500).json({ error: "Failed to fetch pods" });
    }
  });

  app.get("/api/pods/:id", async (req, res) => {
    try {
      const podId = Number(req.params.id);
      const pod = await storage.getPod(podId);
      if (!pod) {
        return res.status(404).json({ error: "Pod not found" });
      }
      res.json(pod);
    } catch (error) {
      console.error("Error fetching pod:", error);
      res.status(500).json({ error: "Failed to fetch pod" });
    }
  });
  
  app.post("/api/pods", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      console.log("Creating pod with data:", req.body);
      // Validate the input data using the insert schema
      const validatedData = insertPodSchema.parse(req.body);
      const pod = await storage.createPod(validatedData);
      console.log("Pod created successfully:", pod);
      res.status(201)
        .header('Content-Type', 'application/json')
        .json(pod);
    } catch (error) {
      console.error("Error creating pod:", error);
      res.status(500).json({ error: "Failed to create pod" });
    }
  });

  app.patch("/api/pods/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const podId = Number(req.params.id);
      const pod = await storage.getPod(podId);
      
      if (!pod) {
        return res.status(404).json({ error: "Pod not found" });
      }
      
      const updatedPod = await storage.updatePod(podId, req.body);
      
      if (!updatedPod) {
        return res.status(500).json({ error: "Failed to update pod" });
      }
      
      res.json({ success: true, pod: updatedPod });
    } catch (error) {
      console.error("Error updating pod:", error);
      res.status(500).json({ 
        error: "Failed to update pod",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.delete("/api/pods/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const podId = Number(req.params.id);
      const pod = await storage.getPod(podId);
      
      if (!pod) {
        return res.status(404).json({ error: "Pod not found" });
      }
      
      // Check if there are classes assigned to this pod
      const classesInPod = await storage.getClassesByPodId(podId);
      if (classesInPod.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete pod with assigned classes. Please reassign or delete classes first." 
        });
      }
      
      const deleted = await storage.deletePod(podId);
      
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete pod" });
      }
      
      res.json({ success: true, message: "Pod deleted successfully" });
    } catch (error) {
      console.error("Error deleting pod:", error);
      res.status(500).json({ error: "Failed to delete pod" });
    }
  });

  // Classes
  app.get("/api/classes", async (req, res) => {
    try {
      const classes = await storage.getAllClasses();
      res.json(classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ error: "Failed to fetch classes" });
    }
  });

  app.get("/api/classes/:id", async (req, res) => {
    try {
      const classId = Number(req.params.id);
      const classObj = await storage.getClass(classId);
      if (!classObj) {
        return res.status(404).json({ error: "Class not found" });
      }
      res.json(classObj);
    } catch (error) {
      console.error("Error fetching class:", error);
      res.status(500).json({ error: "Failed to fetch class" });
    }
  });
  
  app.post("/api/classes", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      console.log("Creating class with data:", req.body);
      // Validate the input data using the insert schema
      const validatedData = insertClassSchema.parse(req.body);
      const classObj = await storage.createClass(validatedData);
      console.log("Class created successfully:", classObj);
      res.status(201)
        .header('Content-Type', 'application/json')
        .json(classObj);
    } catch (error) {
      console.error("Error creating class:", error);
      res.status(500).json({ error: "Failed to create class" });
    }
  });

  app.patch("/api/classes/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const classId = Number(req.params.id);
      const classObj = await storage.getClass(classId);
      
      if (!classObj) {
        return res.status(404).json({ error: "Class not found" });
      }
      
      const updatedClass = await storage.updateClass(classId, req.body);
      
      if (!updatedClass) {
        return res.status(500).json({ error: "Failed to update class" });
      }
      
      res.json({ success: true, class: updatedClass });
    } catch (error) {
      console.error("Error updating class:", error);
      res.status(500).json({ 
        error: "Failed to update class",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.delete("/api/classes/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const classId = Number(req.params.id);
      const classObj = await storage.getClass(classId);
      
      if (!classObj) {
        return res.status(404).json({ error: "Class not found" });
      }
      
      // Check if there are students assigned to this class
      const studentsInClass = await storage.getStudentsByClassId(classId);
      if (studentsInClass.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete class with assigned students. Please reassign students first." 
        });
      }
      
      const deleted = await storage.deleteClass(classId);
      
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete class" });
      }
      
      res.json({ success: true, message: "Class deleted successfully" });
    } catch (error) {
      console.error("Error deleting class:", error);
      res.status(500).json({ error: "Failed to delete class" });
    }
  });

  // Endpoint to assign multiple students to a class
  app.post("/api/classes/:id/assign-students", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const classId = Number(req.params.id);
      const { studentIds } = req.body;
      
      // Validate input
      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ error: "Invalid request: studentIds array is required" });
      }
      
      // Check if class exists
      const classObj = await storage.getClass(classId);
      if (!classObj) {
        return res.status(404).json({ error: "Class not found" });
      }
      
      // Get all users to update
      const students = await Promise.all(
        studentIds.map(id => storage.getUser(Number(id)))
      );
      
      // Filter out non-existent users and non-students
      const validStudents = students.filter(
        student => student && student.role === "student"
      );
      
      if (validStudents.length === 0) {
        return res.status(400).json({ error: "No valid students found in the provided IDs" });
      }
      
      // Update each student's class ID
      const updated = await Promise.all(
        validStudents.map(student => {
          if (student) {
            return storage.updateUser(student.id, { classId });
          }
          return null;
        })
      );
      
      res.status(200).json({
        success: true,
        message: `${updated.filter(Boolean).length} students assigned to class successfully`,
        assignedStudents: updated.filter(Boolean)
      });
    } catch (error) {
      console.error("Error assigning students to class:", error);
      res.status(500).json({ 
        error: "Failed to assign students to class",
        details: error instanceof Error ? error.message : "Unknown error"
      });
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
  
  // SUPER SIMPLIFIED endpoint for batch behavior points submission
  app.post("/api/behavior-points/batch", async (req: Request, res: Response) => {
    console.log("============ SUPER SIMPLIFIED BATCH POINTS REQUEST ============");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Authenticated:", req.isAuthenticated());
    
    // Basic input validation
    if (!req.body || !req.body.points || !Array.isArray(req.body.points) || req.body.points.length === 0) {
      console.error("Invalid request structure:", req.body);
      return res.status(400).json({ error: "Invalid request: proper points array is required" });
    }
    
    // Auth check
    if (!req.isAuthenticated() || !["admin", "teacher"].includes(req.user.role)) {
      console.error("Unauthorized access attempt");
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    try {
      const { points } = req.body;
      const createdPoints = [];
      
      console.log(`Processing ${points.length} behavior points in batch.`);
      
      // Simply loop through and create each point directly using storage interface
      for (const pointData of points) {
        try {
          console.log("Processing point:", pointData);
          const point = await storage.createBehaviorPoint(pointData);
          createdPoints.push(point);
        } catch (error) {
          console.error("Error creating individual point:", error);
          // Continue processing remaining points
        }
      }
      
      if (createdPoints.length === 0) {
        return res.status(400).json({ error: "No behavior points were created" });
      }
      
      console.log(`Successfully created ${createdPoints.length} behavior points`);
      
      // Return success
      res.status(201).json({
        success: true,
        count: createdPoints.length,
        points: createdPoints
      });
    } catch (error) {
      console.error("Error in batch behavior points submission:", error);
      res.status(500).json({ error: "Failed to process batch behavior points" });
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
  
  // Delete all behavior points (admin only)
  app.delete("/api/behavior-points/all", async (req, res) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ error: "Only administrators can reset all points" });
      }
      
      await storage.deleteAllBehaviorPoints();
      res.status(200).json({ message: "All behavior points have been deleted and house points reset" });
    } catch (error: any) {
      console.error("Error deleting all behavior points:", error.message || 'Unknown error', error.stack);
      res.status(500).json({ error: "Failed to delete all behavior points" });
    }
  });
  
  // Delete behavior points for a specific student (admin only)
  app.delete("/api/behavior-points/student/:studentId", async (req, res) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ error: "Only administrators can delete student points" });
      }
      
      const studentId = Number(req.params.studentId);
      if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }
      
      // Check if student exists
      const student = await storage.getUser(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      
      await storage.deleteBehaviorPointsByStudentId(studentId);
      res.status(200).json({ 
        message: `All behavior points for student ${student.firstName} ${student.lastName} have been deleted` 
      });
    } catch (error: any) {
      console.error(`Error deleting behavior points for student:`, error.message || 'Unknown error', error.stack);
      res.status(500).json({ error: "Failed to delete student behavior points" });
    }
  });
  
  // Top Students per House
  app.get("/api/houses-top-students", async (req, res) => {
    try {
      const houses = await storage.getAllHouses();
      const result = await Promise.all(
        houses.map(async (house) => {
          const students = await storage.getStudentsByHouseId(house.id);
          let topStudent = null;
          let maxPoints = 0;
          let houseTotal = 0;
          
          // Calculate the total points for all students in this house
          for (const student of students) {
            const points = await storage.getBehaviorPointsByStudentId(student.id);
            const studentTotal = points.reduce((sum, point) => sum + point.points, 0);
            houseTotal += studentTotal;
            
            if (studentTotal > maxPoints) {
              maxPoints = studentTotal;
              topStudent = {
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                totalPoints: studentTotal
              };
            }
          }
          
          // Ensure house points match the total calculated from all students
          if (house.points !== houseTotal) {
            console.log(`Correcting house points for ${house.name}: DB=${house.points}, Calculated=${houseTotal}`);
            await storage.updateHouse(house.id, { points: houseTotal });
            house.points = houseTotal;
          }
          
          return {
            houseId: house.id,
            houseName: house.name,
            houseColor: house.color,
            housePoints: houseTotal, // Use our calculated total
            topStudent: topStudent
          };
        })
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching top students:', error);
      res.status(500).json({ error: 'Failed to fetch top students' });
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
  // Handle requests without a role parameter
  app.get("/api/users/role", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    return res.status(400).json({ error: "Role parameter is required" });
  });
  
  app.get("/api/users/role/:role", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const { role } = req.params;
      let users = [];
      
      // Special handling for "all" role
      if (role === 'all') {
        users = await storage.getAllUsers();
      } else if (userRoles.includes(role as any)) {
        users = await storage.getUsersByRole(role);
      } else {
        return res.status(400).json({ error: "Invalid role" });
      }
      
      // Only return necessary fields for security
      const safeUsers = users.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        role: user.role,
        gradeLevel: user.gradeLevel,
        section: user.section,
        houseId: user.houseId
      }));
      
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users by role:", error);
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
        username: user.username,
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
  app.patch("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const userId = Number(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // If password is included, hash it before update
      let userData = req.body;
      
      if (userData.password) {
        const { scrypt, randomBytes } = await import('crypto');
        const { promisify } = await import('util');
        const scryptAsync = promisify(scrypt);
        
        // Hash the password using the same method as in auth.ts
        const salt = randomBytes(16).toString("hex");
        const buf = (await scryptAsync(userData.password, salt, 64)) as Buffer;
        userData.password = `${buf.toString("hex")}.${salt}`;
      }
      
      // Update user
      const updatedUser = await storage.updateUser(userId, userData);
      
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update user" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.post("/api/users/:id/change-password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "You must be logged in" });
    }
    
    try {
      const userId = Number(req.params.id);
      
      // Only allow users to change their own password, or admins to change anyone's
      if (req.user.id !== userId && req.user.role !== "admin") {
        return res.status(403).json({ error: "You can only change your own password" });
      }
      
      // Validate request body
      if (!req.body.currentPassword || !req.body.newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }
      
      // Get the user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Verify the current password
      const passwordMatches = await comparePasswords(req.body.currentPassword, user.password);
      
      if (!passwordMatches) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(req.body.newPassword);
      
      // Update the user with the new password
      const updatedUser = await storage.updateUser(userId, { password: hashedPassword });
      
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update password" });
      }
      
      res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });
  
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
      
      // Admin users can delete any account, non-admin users can only delete student accounts
      if (req.user.role !== "admin" && user.role !== "student") {
        return res.status(403).json({ error: "Only admin users can delete non-student accounts" });
      }
      
      // Prevent users from deleting their own account
      if (user.id === req.user.id) {
        return res.status(403).json({ error: "Cannot delete your own account" });
      }
      
      // Use direct SQL queries to delete associated records, bypassing ORM and foreign key constraints
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        console.log(`Transaction started for deletion of user ${userId}`);
        
        let bpResultStudentId: { rowCount: number } = { rowCount: 0 };
        let bpResultTeacherId: { rowCount: number } = { rowCount: 0 };
        let rrResult: { rowCount: number } = { rowCount: 0 };
        
        if (user.role === 'student') {
          // Delete behavior points for this student
          console.log(`Deleting behavior points for student ${userId}`);
          const studBpResult = await client.query(
            'DELETE FROM behavior_points WHERE student_id = $1',
            [userId]
          );
          bpResultStudentId.rowCount = studBpResult.rowCount || 0;
          console.log(`Deleted ${bpResultStudentId.rowCount} behavior points for student`);
          
          // Delete reward redemptions for this student
          console.log(`Deleting reward redemptions for student ${userId}`);
          const rewardResult = await client.query(
            'DELETE FROM reward_redemptions WHERE student_id = $1',
            [userId]
          );
          rrResult.rowCount = rewardResult.rowCount || 0;
          console.log(`Deleted ${rrResult.rowCount} reward redemptions`);
        }
        
        if (user.role === 'teacher') {
          // Delete behavior points assigned by this teacher
          console.log(`Deleting behavior points assigned by teacher ${userId}`);
          const teachBpResult = await client.query(
            'DELETE FROM behavior_points WHERE teacher_id = $1',
            [userId]
          );
          bpResultTeacherId.rowCount = teachBpResult.rowCount || 0;
          console.log(`Deleted ${bpResultTeacherId.rowCount} behavior points assigned by teacher`);
        }
        
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
            behaviorPointsStudentDeleted: bpResultStudentId.rowCount,
            behaviorPointsTeacherDeleted: bpResultTeacherId.rowCount,
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

  // Bulk delete users
  app.post("/api/users/bulk-delete", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized - Only administrators can perform bulk delete" });
    }

    try {
      const { userIds } = req.body;
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "No user IDs provided for deletion" });
      }
      
      // Convert all IDs to numbers and validate
      const validUserIds = userIds.map(Number).filter(id => !isNaN(id));
      
      if (validUserIds.length === 0) {
        return res.status(400).json({ error: "No valid user IDs provided" });
      }
      
      console.log(`Bulk delete request for ${validUserIds.length} users`);
      
      // Create a client for transaction
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        let deletedCount = 0;
        let skippedIds = [];
        
        // Process each user ID
        for (const userId of validUserIds) {
          // Check if user exists
          const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
          
          if (userResult.rows.length === 0) {
            skippedIds.push({ id: userId, reason: "User not found" });
            continue;
          }
          
          const user = userResult.rows[0];
          
          // Prevent deletion of current user
          if (user.id === req.user.id) {
            skippedIds.push({ id: userId, reason: "Cannot delete your own account" });
            continue;
          }
          
          // Delete related records based on role
          if (user.role === 'student') {
            // Delete behavior points for this student
            await client.query('DELETE FROM behavior_points WHERE student_id = $1', [userId]);
            
            // Delete reward redemptions for this student
            await client.query('DELETE FROM reward_redemptions WHERE student_id = $1', [userId]);
          } else if (user.role === 'teacher') {
            // Delete behavior points assigned by this teacher
            await client.query('DELETE FROM behavior_points WHERE teacher_id = $1', [userId]);
          }
          
          // Delete the user
          const deleteResult = await client.query('DELETE FROM users WHERE id = $1', [userId]);
          
          const rowCount = deleteResult?.rowCount ?? 0;
          if (rowCount > 0) {
            deletedCount++;
          } else {
            skippedIds.push({ id: userId, reason: "Failed to delete" });
          }
        }
        
        // Commit the transaction
        await client.query('COMMIT');
        
        return res.status(200).json({
          success: true,
          deletedCount,
          skippedIds,
          message: `Successfully deleted ${deletedCount} users`
        });
      } catch (txError: any) {
        // Roll back the transaction if any step fails
        await client.query('ROLLBACK');
        console.error(`Bulk delete transaction rolled back: ${txError.message || 'Unknown error'}`);
        
        return res.status(500).json({
          error: "Failed to delete users",
          details: txError.message || "Unknown database error",
        });
      } finally {
        // Always release the client
        client.release();
      }
    } catch (error: any) {
      console.error("Error in bulk delete operation:", error);
      return res.status(500).json({
        error: "Failed to process bulk delete request",
        details: error.message || "Unknown error"
      });
    }
  });

  // Update user endpoint
  app.put("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
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
      
      // Admin users can update any account, non-admin users can only update student accounts
      if (req.user.role !== "admin" && user.role !== "student") {
        return res.status(403).json({ error: "Only admin users can update non-student accounts" });
      }
      
      // Extract update fields from request
      const {
        firstName, 
        lastName, 
        email, 
        gradeLevel,
        section,
        houseId
      } = req.body;
      
      // Create update object with only provided fields
      const updateFields: Partial<User> = {};
      
      if (firstName !== undefined) updateFields.firstName = firstName;
      if (lastName !== undefined) updateFields.lastName = lastName;
      if (email !== undefined) updateFields.email = email;
      if (gradeLevel !== undefined) updateFields.gradeLevel = gradeLevel;
      if (section !== undefined) updateFields.section = section;
      if (houseId !== undefined) updateFields.houseId = houseId === null ? null : Number(houseId);
      
      // If no fields are provided to update
      if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ error: "No valid update fields provided" });
      }
      
      // Update the user
      const updatedUser = await storage.updateUser(userId, updateFields);
      
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update user" });
      }
      
      // Return safe user data
      const safeUser = {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        email: updatedUser.email,
        gradeLevel: updatedUser.gradeLevel,
        section: updatedUser.section,
        houseId: updatedUser.houseId
      };
      
      return res.status(200).json(safeUser);
    } catch (error: any) {
      console.error("Error updating user:", error);
      return res.status(500).json({ 
        error: "Failed to update user",
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
  
  // Bulk assign students to houses
  app.post("/api/houses/:houseId/assign-students", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    try {
      const houseId = Number(req.params.houseId);
      const { studentIds } = req.body;
      
      // Validate request
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ error: "No student IDs provided" });
      }
      
      // Verify house exists
      const house = await storage.getHouse(houseId);
      if (!house) {
        return res.status(404).json({ error: "House not found" });
      }
      
      // Use a transaction for this bulk operation
      const client = await pool.connect();
      const updatedStudents = [];
      
      try {
        await client.query('BEGIN');
        
        for (const studentId of studentIds) {
          // Verify each student exists and is a student
          const student = await storage.getUser(studentId);
          
          if (!student || student.role !== 'student') {
            console.warn(`Skipping invalid student ID: ${studentId}`);
            continue;
          }
          
          // Update the student's house
          const result = await client.query(
            'UPDATE users SET house_id = $1 WHERE id = $2 AND role = $3 RETURNING id, first_name AS "firstName", last_name AS "lastName", house_id AS "houseId"',
            [houseId, studentId, 'student']
          );
          
          if (result.rows.length > 0) {
            updatedStudents.push(result.rows[0]);
          }
        }
        
        await client.query('COMMIT');
        console.log(`Successfully assigned ${updatedStudents.length} students to house ${houseId}`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error assigning students to house ${houseId}:`, error);
        throw error;
      } finally {
        client.release();
      }
      
      res.json({
        success: true,
        house: house,
        updatedCount: updatedStudents.length,
        updatedStudents: updatedStudents
      });
    } catch (error) {
      console.error("Error assigning students to house:", error);
      res.status(500).json({
        error: "Failed to assign students to house",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Incident Reports
  app.get("/api/incident-reports", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      let reports;

      // If admin, get all incident reports
      if (req.user.role === "admin") {
        reports = await storage.getAllIncidentReports();
      } else {
        // If teacher, get only their incident reports
        reports = await storage.getIncidentReportsByTeacherId(req.user.id);
      }

      res.json(reports);
    } catch (error) {
      console.error("Error fetching incident reports:", error);
      res.status(500).json({ 
        error: "Failed to fetch incident reports",
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/incident-reports/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const reportId = Number(req.params.id);
      const report = await storage.getIncidentReport(reportId);

      if (!report) {
        return res.status(404).json({ error: "Incident report not found" });
      }

      // Teachers can only view their own reports
      if (req.user.role === "teacher" && report.teacherId !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized to view this incident report" });
      }

      res.json(report);
    } catch (error) {
      console.error("Error fetching incident report:", error);
      res.status(500).json({ 
        error: "Failed to fetch incident report",
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/incident-reports/student/:studentId", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const studentId = Number(req.params.studentId);
      const reports = await storage.getIncidentReportsByStudentId(studentId);
      
      // Teachers can only view reports they submitted
      if (req.user.role === "teacher") {
        const filteredReports = reports.filter(report => report.teacherId === req.user.id);
        return res.json(filteredReports);
      }

      res.json(reports);
    } catch (error) {
      console.error(`Error fetching incident reports for student ${req.params.studentId}:`, error);
      res.status(500).json({ 
        error: "Failed to fetch incident reports",
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/incident-reports", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      // Set the teacherId to the current user's ID
      const reportData = {
        ...req.body,
        teacherId: req.user.id
      };

      // Validate student IDs exist
      if (!reportData.studentIds || !Array.isArray(reportData.studentIds) || reportData.studentIds.length === 0) {
        return res.status(400).json({ error: "At least one student must be involved in the incident" });
      }

      const report = await storage.createIncidentReport(reportData);
      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating incident report:", error);
      res.status(500).json({ 
        error: "Failed to create incident report",
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.patch("/api/incident-reports/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const reportId = Number(req.params.id);
      const report = await storage.getIncidentReport(reportId);

      if (!report) {
        return res.status(404).json({ error: "Incident report not found" });
      }

      // Only the teacher who created the report or an admin can update it
      if (req.user.role === "teacher" && report.teacherId !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized to update this incident report" });
      }

      // If the update includes admin response, only admins can do this
      if ((req.body.adminResponse || req.body.status) && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only administrators can update admin responses or status" });
      }

      // If admin is responding, set the adminId
      const updateData = {...req.body};
      if (req.user.role === "admin" && (updateData.adminResponse || updateData.status !== report.status)) {
        updateData.adminId = req.user.id;
      }

      const updatedReport = await storage.updateIncidentReport(reportId, updateData);
      res.json(updatedReport);
    } catch (error) {
      console.error(`Error updating incident report ${req.params.id}:`, error);
      res.status(500).json({ 
        error: "Failed to update incident report",
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.delete("/api/incident-reports/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Only administrators can delete incident reports" });
    }

    try {
      const reportId = Number(req.params.id);
      const report = await storage.getIncidentReport(reportId);

      if (!report) {
        return res.status(404).json({ error: "Incident report not found" });
      }

      const deleted = await storage.deleteIncidentReport(reportId);
      
      if (deleted) {
        res.json({ success: true, message: "Incident report deleted successfully" });
      } else {
        res.status(500).json({ error: "Failed to delete incident report" });
      }
    } catch (error) {
      console.error(`Error deleting incident report ${req.params.id}:`, error);
      res.status(500).json({ 
        error: "Failed to delete incident report",
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

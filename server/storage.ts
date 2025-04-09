import { users, pods, classes, behaviorCategories, behaviorPoints, rewards, rewardRedemptions, incidentReports } from "@shared/schema";
import type { 
  User, InsertUser, Pod, InsertPod, Class, InsertClass,
  BehaviorCategory, InsertBehaviorCategory, 
  BehaviorPoint, InsertBehaviorPoint, 
  Reward, InsertReward, 
  RewardRedemption, InsertRewardRedemption, 
  IncidentReport, InsertIncidentReport, 
  IncidentStatus, IncidentType,
  UserRole 
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { and, eq, desc } from "drizzle-orm";
import { db, pool } from "./db";

// Helper function to ensure correct typing for User objects
function ensureUserType(user: any): User {
  if (user) {
    // Set podId to null if undefined
    if (user.podId === undefined) {
      user.podId = null;
    }
    
    // Set classId to null if undefined
    if (user.classId === undefined) {
      user.classId = null;
    }
    
    return user as User;
  }
  return user as User;
}

// Create session stores
const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number, forceDelete?: boolean): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  getStudentsByParentId(parentId: number): Promise<User[]>;
  getStudentsByPodId(podId: number): Promise<User[]>;
  getStudentsByClassId(classId: number): Promise<User[]>;
  
  // Pod management
  getPod(id: number): Promise<Pod | undefined>;
  getPodByName(name: string): Promise<Pod | undefined>;
  createPod(pod: InsertPod): Promise<Pod>;
  updatePod(id: number, pod: Partial<Pod>): Promise<Pod | undefined>;
  deletePod(id: number): Promise<boolean>;
  getAllPods(): Promise<Pod[]>;
  updatePodPoints(id: number, points: number): Promise<Pod | undefined>;
  
  // Class management
  getClass(id: number): Promise<Class | undefined>;
  getClassesByPodId(podId: number): Promise<Class[]>;
  createClass(classObj: InsertClass): Promise<Class>;
  updateClass(id: number, classObj: Partial<Class>): Promise<Class | undefined>;
  deleteClass(id: number): Promise<boolean>;
  getAllClasses(): Promise<Class[]>;
  
  // Behavior categories
  getBehaviorCategory(id: number): Promise<BehaviorCategory | undefined>;
  createBehaviorCategory(category: InsertBehaviorCategory): Promise<BehaviorCategory>;
  getAllBehaviorCategories(): Promise<BehaviorCategory[]>;
  updateBehaviorCategory(id: number, category: Partial<BehaviorCategory>): Promise<BehaviorCategory | undefined>;
  deleteBehaviorCategory(id: number): Promise<boolean>;
  getBehaviorPointsByCategoryId(categoryId: number): Promise<BehaviorPoint[]>;
  
  // Behavior points
  createBehaviorPoint(point: InsertBehaviorPoint): Promise<BehaviorPoint>;
  getBehaviorPointsByStudentId(studentId: number): Promise<BehaviorPoint[]>;
  getBehaviorPointsByTeacherId(teacherId: number): Promise<BehaviorPoint[]>;
  getRecentBehaviorPoints(limit: number): Promise<BehaviorPoint[]>;
  deleteAllBehaviorPoints(): Promise<void>;
  deleteBehaviorPointsByStudentId(studentId: number): Promise<void>;
  
  // Rewards
  getReward(id: number): Promise<Reward | undefined>;
  createReward(reward: InsertReward): Promise<Reward>;
  updateReward(id: number, reward: Partial<Reward>): Promise<Reward | undefined>;
  getAllRewards(): Promise<Reward[]>;
  
  // Reward redemptions
  createRewardRedemption(redemption: InsertRewardRedemption): Promise<RewardRedemption>;
  getRewardRedemptionsByStudentId(studentId: number): Promise<RewardRedemption[]>;
  updateRewardRedemptionStatus(id: number, status: "pending" | "approved" | "delivered"): Promise<RewardRedemption | undefined>;
  
  // Incident reports
  createIncidentReport(report: InsertIncidentReport): Promise<IncidentReport>;
  getIncidentReport(id: number): Promise<IncidentReport | undefined>;
  getIncidentReportsByTeacherId(teacherId: number): Promise<IncidentReport[]>;
  getIncidentReportsByStudentId(studentId: number): Promise<IncidentReport[]>;
  getAllIncidentReports(): Promise<IncidentReport[]>;
  updateIncidentReport(id: number, report: Partial<IncidentReport>): Promise<IncidentReport | undefined>;
  deleteIncidentReport(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: any; // Using any for session store type to avoid compatibility issues
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private pods: Map<number, Pod>;
  private classes: Map<number, Class>;
  private behaviorCategories: Map<number, BehaviorCategory>;
  private behaviorPoints: Map<number, BehaviorPoint>;
  private rewards: Map<number, Reward>;
  private rewardRedemptions: Map<number, RewardRedemption>;
  private incidentReports: Map<number, IncidentReport>;
  
  sessionStore: any; // Using any instead of session.SessionStore
  
  private userCurrentId: number;
  private podCurrentId: number;
  private classCurrentId: number;
  private categoryCurrentId: number;
  private pointCurrentId: number;
  private rewardCurrentId: number;
  private redemptionCurrentId: number;
  private incidentCurrentId: number;

  constructor() {
    this.users = new Map();
    this.pods = new Map();
    this.classes = new Map();
    this.behaviorCategories = new Map();
    this.behaviorPoints = new Map();
    this.rewards = new Map();
    this.rewardRedemptions = new Map();
    this.incidentReports = new Map();
    
    this.userCurrentId = 1;
    this.podCurrentId = 1;
    this.classCurrentId = 1;
    this.categoryCurrentId = 1;
    this.pointCurrentId = 1;
    this.rewardCurrentId = 1;
    this.redemptionCurrentId = 1;
    this.incidentCurrentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Initialize with demo data
    // We can't make the constructor async, so we call the function
    // and ignore the promise (which is fine for initialization)
    this.initializeDemo().catch(err => {
      console.error("Error initializing demo data:", err);
    });
  }

  private async initializeDemo() {
    // Create pods
    const pods = [
      { name: 'Phoenix', color: '#3b82f6', description: 'Pod of courage and rebirth', logoUrl: '' },
      { name: 'Griffin', color: '#10b981', description: 'Pod of nobility and strength', logoUrl: '' },
      { name: 'Dragon', color: '#f59e0b', description: 'Pod of wisdom and power', logoUrl: '' },
      { name: 'Pegasus', color: '#ef4444', description: 'Pod of freedom and inspiration', logoUrl: '' }
    ];
    
    // Create pods first
    const createdPods: Pod[] = [];
    for (const pod of pods) {
      const newPod = await this.createPod(pod);
      createdPods.push(newPod);
    }
    
    // Create classes within pods
    const classes = [
      { name: '1A', podId: createdPods[0].id, gradeLevel: '1', description: 'First grade, section A' },
      { name: '1B', podId: createdPods[1].id, gradeLevel: '1', description: 'First grade, section B' },
      { name: '2A', podId: createdPods[2].id, gradeLevel: '2', description: 'Second grade, section A' },
      { name: '2B', podId: createdPods[3].id, gradeLevel: '2', description: 'Second grade, section B' },
      { name: '3A', podId: createdPods[0].id, gradeLevel: '3', description: 'Third grade, section A' },
      { name: '3B', podId: createdPods[1].id, gradeLevel: '3', description: 'Third grade, section B' },
      { name: '4A', podId: createdPods[2].id, gradeLevel: '4', description: 'Fourth grade, section A' },
      { name: '4B', podId: createdPods[3].id, gradeLevel: '4', description: 'Fourth grade, section B' }
    ];
    
    for (const classObj of classes) {
      await this.createClass(classObj);
    }
    
    // Create behavior categories
    const categories = [
      { name: 'Academic Excellence', description: 'Outstanding academic performance', isPositive: true, pointValue: 5 },
      { name: 'Helping Others', description: 'Assisting peers or staff', isPositive: true, pointValue: 3 },
      { name: 'Teamwork', description: 'Great collaboration with others', isPositive: true, pointValue: 4 },
      { name: 'Leadership', description: 'Demonstrating leadership skills', isPositive: true, pointValue: 5 },
      { name: 'Classroom Disruption', description: 'Disrupting the learning environment', isPositive: false, pointValue: 2 },
      { name: 'Late Assignment', description: 'Submitting work after deadline', isPositive: false, pointValue: 1 },
      { name: 'Tardiness', description: 'Arriving late to class', isPositive: false, pointValue: 1 }
    ];
    
    categories.forEach(category => this.createBehaviorCategory(category));
    
    // Create rewards
    const rewards = [
      { name: 'Homework Pass', description: 'Skip one homework assignment', pointCost: 20, quantity: 10, imageUrl: '' },
      { name: 'Lunch with Teacher', description: 'Have lunch with your favorite teacher', pointCost: 30, quantity: 5, imageUrl: '' },
      { name: 'School Store Voucher', description: '$5 voucher for the school store', pointCost: 25, quantity: 15, imageUrl: '' },
      { name: 'Front of Lunch Line Pass', description: 'Skip the lunch line for a week', pointCost: 15, quantity: 20, imageUrl: '' }
    ];
    
    rewards.forEach(reward => this.createReward(reward));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    
    // Create a properly typed user object with default values for optional fields
    const user: User = {
      id,
      username: String(insertUser.username),
      password: String(insertUser.password),
      firstName: String(insertUser.firstName),
      lastName: String(insertUser.lastName),
      role: String(insertUser.role) as UserRole,
      email: String(insertUser.email),
      gradeLevel: insertUser.gradeLevel ? String(insertUser.gradeLevel) : null,
      section: insertUser.section ? String(insertUser.section) : null,
      parentId: typeof insertUser.parentId === 'number' ? insertUser.parentId : null,
      classId: typeof insertUser.classId === 'number' ? insertUser.classId : null,
      podId: typeof insertUser.podId === 'number' ? insertUser.podId : null
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number, forceDelete: boolean = false): Promise<boolean> {
    if (!this.users.has(id)) return false;
    
    // If force delete is enabled, also delete related records
    if (forceDelete) {
      // Remove behavior points for this user
      Array.from(this.behaviorPoints.entries())
        .filter(([_, point]) => point.studentId === id)
        .forEach(([pointId, _]) => this.behaviorPoints.delete(pointId));
      
      // Remove reward redemptions for this user
      Array.from(this.rewardRedemptions.entries())
        .filter(([_, redemption]) => redemption.studentId === id)
        .forEach(([redemptionId, _]) => this.rewardRedemptions.delete(redemptionId));
    }
    
    // Delete the user
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  async getStudentsByParentId(parentId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => 
      user.role === 'student' && user.parentId === parentId
    );
  }

  async getStudentsByPodId(podId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => 
      user.role === 'student' && user.podId === podId
    );
  }

  async getStudentsByClassId(classId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => 
      user.role === 'student' && user.classId === classId
    );
  }

  // Pod methods
  async getPod(id: number): Promise<Pod | undefined> {
    return this.pods.get(id);
  }

  async getPodByName(name: string): Promise<Pod | undefined> {
    return Array.from(this.pods.values()).find(
      (pod) => pod.name === name
    );
  }

  async createPod(pod: InsertPod): Promise<Pod> {
    const id = this.podCurrentId++;
    const newPod: Pod = {
      id,
      name: pod.name,
      color: pod.color,
      points: 0,
      description: pod.description || null,
      logoUrl: pod.logoUrl || null
    };
    this.pods.set(id, newPod);
    return newPod;
  }

  async updatePod(id: number, podUpdate: Partial<Pod>): Promise<Pod | undefined> {
    const pod = this.pods.get(id);
    if (!pod) return undefined;
    
    const updatedPod = { ...pod, ...podUpdate };
    this.pods.set(id, updatedPod);
    return updatedPod;
  }
  
  async deletePod(id: number): Promise<boolean> {
    if (!this.pods.has(id)) return false;
    return this.pods.delete(id);
  }

  async getAllPods(): Promise<Pod[]> {
    return Array.from(this.pods.values());
  }

  async updatePodPoints(id: number, points: number): Promise<Pod | undefined> {
    const pod = this.pods.get(id);
    if (!pod) return undefined;
    
    const updatedPod = { ...pod, points: pod.points + points };
    this.pods.set(id, updatedPod);
    return updatedPod;
  }
  
  // Class methods
  async getClass(id: number): Promise<Class | undefined> {
    return this.classes.get(id);
  }
  
  async getClassesByPodId(podId: number): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(cls => 
      cls.podId === podId
    );
  }
  
  async createClass(classObj: InsertClass): Promise<Class> {
    const id = this.classCurrentId++;
    const newClass: Class = {
      id,
      name: classObj.name,
      podId: classObj.podId,
      gradeLevel: classObj.gradeLevel || null,
      description: classObj.description || null
    };
    this.classes.set(id, newClass);
    return newClass;
  }
  
  async updateClass(id: number, classUpdate: Partial<Class>): Promise<Class | undefined> {
    const classObj = this.classes.get(id);
    if (!classObj) return undefined;
    
    const updatedClass = { ...classObj, ...classUpdate };
    this.classes.set(id, updatedClass);
    return updatedClass;
  }
  
  async deleteClass(id: number): Promise<boolean> {
    if (!this.classes.has(id)) return false;
    return this.classes.delete(id);
  }
  
  async getAllClasses(): Promise<Class[]> {
    return Array.from(this.classes.values());
  }

  // Behavior category methods
  async getBehaviorCategory(id: number): Promise<BehaviorCategory | undefined> {
    return this.behaviorCategories.get(id);
  }

  async createBehaviorCategory(category: InsertBehaviorCategory): Promise<BehaviorCategory> {
    const id = this.categoryCurrentId++;
    const newCategory: BehaviorCategory = {
      id,
      name: category.name,
      description: category.description || null,
      isPositive: category.isPositive,
      pointValue: category.pointValue
    };
    this.behaviorCategories.set(id, newCategory);
    return newCategory;
  }

  async getAllBehaviorCategories(): Promise<BehaviorCategory[]> {
    return Array.from(this.behaviorCategories.values());
  }
  
  async updateBehaviorCategory(id: number, categoryUpdate: Partial<BehaviorCategory>): Promise<BehaviorCategory | undefined> {
    const category = this.behaviorCategories.get(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...categoryUpdate };
    this.behaviorCategories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async deleteBehaviorCategory(id: number): Promise<boolean> {
    if (!this.behaviorCategories.has(id)) return false;
    return this.behaviorCategories.delete(id);
  }
  
  async getBehaviorPointsByCategoryId(categoryId: number): Promise<BehaviorPoint[]> {
    return Array.from(this.behaviorPoints.values())
      .filter(point => point.categoryId === categoryId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Behavior points methods
  async createBehaviorPoint(point: InsertBehaviorPoint): Promise<BehaviorPoint> {
    const id = this.pointCurrentId++;
    const newPoint: BehaviorPoint = { 
      id,
      points: point.points,
      studentId: point.studentId,
      teacherId: point.teacherId,
      categoryId: point.categoryId,
      notes: point.notes || null,
      timestamp: new Date() 
    };
    this.behaviorPoints.set(id, newPoint);
    
    // Update pod points if student is in a pod or class
    const student = await this.getUser(point.studentId);
    
    if (student && student.podId) {
      // Direct pod association
      await this.updatePodPoints(student.podId, point.points);
    } else if (student && student.classId) {
      // Get the pod through class association
      const classObj = await this.getClass(student.classId);
      if (classObj && classObj.podId) {
        await this.updatePodPoints(classObj.podId, point.points);
      }
    }
    
    return newPoint;
  }

  async getBehaviorPointsByStudentId(studentId: number): Promise<BehaviorPoint[]> {
    return Array.from(this.behaviorPoints.values())
      .filter(point => point.studentId === studentId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getBehaviorPointsByTeacherId(teacherId: number): Promise<BehaviorPoint[]> {
    return Array.from(this.behaviorPoints.values())
      .filter(point => point.teacherId === teacherId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getRecentBehaviorPoints(limit: number): Promise<BehaviorPoint[]> {
    return Array.from(this.behaviorPoints.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
  
  async deleteAllBehaviorPoints(): Promise<void> {
    // Clear behavior points map
    this.behaviorPoints.clear();
    
    // Reset all pod points to 0
    const pods = Array.from(this.pods.values());
    for (const pod of pods) {
      pod.points = 0;
      this.pods.set(pod.id, pod);
    }
  }
  
  async deleteBehaviorPointsByStudentId(studentId: number): Promise<void> {
    // Get the student
    const student = await this.getUser(studentId);
    
    // Calculate total points from this student
    const studentPoints = Array.from(this.behaviorPoints.values())
      .filter(point => point.studentId === studentId);
    
    if (studentPoints.length === 0) return;
    
    // Calculate the sum to subtract
    const pointsToSubtract = studentPoints.reduce((sum, point) => sum + point.points, 0);
    
    // Update pod points if needed
    let podId: number | null = null;
    
    if (student && student.podId) {
      // Direct pod association
      podId = student.podId;
    } else if (student && student.classId) {
      // Get the pod through class association
      const classObj = await this.getClass(student.classId);
      if (classObj && classObj.podId) {
        podId = classObj.podId;
      }
    }
    
    if (podId) {
      const pod = await this.getPod(podId);
      if (pod) {
        pod.points = Math.max(0, pod.points - pointsToSubtract);
        this.pods.set(pod.id, pod);
      }
    }
    
    // Delete all behavior points for this student
    const pointEntries = Array.from(this.behaviorPoints.entries());
    for (const [id, point] of pointEntries) {
      if (point.studentId === studentId) {
        this.behaviorPoints.delete(id);
      }
    }
  }

  // Rewards methods
  async getReward(id: number): Promise<Reward | undefined> {
    return this.rewards.get(id);
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const id = this.rewardCurrentId++;
    const newReward: Reward = {
      id,
      name: reward.name,
      description: reward.description || null,
      pointCost: reward.pointCost,
      quantity: reward.quantity,
      imageUrl: reward.imageUrl || null
    };
    this.rewards.set(id, newReward);
    return newReward;
  }

  async updateReward(id: number, rewardUpdate: Partial<Reward>): Promise<Reward | undefined> {
    const reward = this.rewards.get(id);
    if (!reward) return undefined;
    
    const updatedReward = { ...reward, ...rewardUpdate };
    this.rewards.set(id, updatedReward);
    return updatedReward;
  }

  async getAllRewards(): Promise<Reward[]> {
    return Array.from(this.rewards.values());
  }

  // Reward redemption methods
  async createRewardRedemption(redemption: InsertRewardRedemption): Promise<RewardRedemption> {
    const id = this.redemptionCurrentId++;
    const newRedemption: RewardRedemption = { 
      ...redemption, 
      id,
      status: 'pending', 
      timestamp: new Date() 
    };
    this.rewardRedemptions.set(id, newRedemption);
    
    // Reduce reward quantity
    const reward = await this.getReward(redemption.rewardId);
    if (reward) {
      await this.updateReward(reward.id, { quantity: reward.quantity - 1 });
    }
    
    return newRedemption;
  }

  async getRewardRedemptionsByStudentId(studentId: number): Promise<RewardRedemption[]> {
    return Array.from(this.rewardRedemptions.values())
      .filter(redemption => redemption.studentId === studentId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async updateRewardRedemptionStatus(id: number, status: "pending" | "approved" | "delivered"): Promise<RewardRedemption | undefined> {
    const redemption = this.rewardRedemptions.get(id);
    if (!redemption) return undefined;
    
    const updatedRedemption = { ...redemption, status };
    this.rewardRedemptions.set(id, updatedRedemption);
    return updatedRedemption;
  }
  
  // Incident report methods
  async createIncidentReport(report: InsertIncidentReport): Promise<IncidentReport> {
    const id = this.incidentCurrentId++;
    // Convert studentIds to proper array if needed
    const studentIdsArray = Array.isArray(report.studentIds) ? report.studentIds : [];
    
    const newReport: IncidentReport = {
      id,
      teacherId: report.teacherId,
      studentIds: studentIdsArray,
      type: report.type,
      description: report.description,
      status: "pending",
      adminResponse: null,
      adminId: null,
      incidentDate: report.incidentDate || new Date(),
      attachmentUrl: report.attachmentUrl || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.incidentReports.set(id, newReport);
    return newReport;
  }
  
  async getIncidentReport(id: number): Promise<IncidentReport | undefined> {
    return this.incidentReports.get(id);
  }
  
  async getIncidentReportsByTeacherId(teacherId: number): Promise<IncidentReport[]> {
    return Array.from(this.incidentReports.values())
      .filter(report => report.teacherId === teacherId)
      .sort((a, b) => b.incidentDate.getTime() - a.incidentDate.getTime());
  }
  
  async getIncidentReportsByStudentId(studentId: number): Promise<IncidentReport[]> {
    return Array.from(this.incidentReports.values())
      .filter(report => report.studentIds.includes(studentId))
      .sort((a, b) => b.incidentDate.getTime() - a.incidentDate.getTime());
  }
  
  async getAllIncidentReports(): Promise<IncidentReport[]> {
    return Array.from(this.incidentReports.values())
      .sort((a, b) => b.incidentDate.getTime() - a.incidentDate.getTime());
  }
  
  async updateIncidentReport(id: number, reportUpdate: Partial<IncidentReport>): Promise<IncidentReport | undefined> {
    const report = this.incidentReports.get(id);
    if (!report) return undefined;
    
    const updatedReport = { 
      ...report, 
      ...reportUpdate, 
      updatedAt: new Date() 
    };
    this.incidentReports.set(id, updatedReport);
    return updatedReport;
  }
  
  async deleteIncidentReport(id: number): Promise<boolean> {
    if (!this.incidentReports.has(id)) return false;
    return this.incidentReports.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any instead of session.SessionStore
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool: pool, 
      tableName: 'session',
      createTableIfMissing: true 
    });
    
    // Initialize demo data if needed
    this.initializeDemo();
  }
  
  private async initializeDemo() {
    try {
      // Check if we already have pods
      const existingPods = await this.getAllPods();
      if (existingPods.length === 0) {
        // Create pods
        const pods = [
          { name: 'Phoenix', color: '#3b82f6', description: 'Pod of courage and rebirth', logoUrl: '' },
          { name: 'Griffin', color: '#10b981', description: 'Pod of nobility and strength', logoUrl: '' },
          { name: 'Dragon', color: '#f59e0b', description: 'Pod of wisdom and power', logoUrl: '' },
          { name: 'Pegasus', color: '#ef4444', description: 'Pod of freedom and inspiration', logoUrl: '' }
        ];
        
        const createdPods: Pod[] = [];
        for (const pod of pods) {
          const newPod = await this.createPod(pod);
          createdPods.push(newPod);
        }
        
        // Create classes within pods
        const classes = [
          { name: '1A', podId: createdPods[0].id, gradeLevel: '1', description: 'First grade, section A' },
          { name: '1B', podId: createdPods[1].id, gradeLevel: '1', description: 'First grade, section B' },
          { name: '2A', podId: createdPods[2].id, gradeLevel: '2', description: 'Second grade, section A' },
          { name: '2B', podId: createdPods[3].id, gradeLevel: '2', description: 'Second grade, section B' },
          { name: '3A', podId: createdPods[0].id, gradeLevel: '3', description: 'Third grade, section A' },
          { name: '3B', podId: createdPods[1].id, gradeLevel: '3', description: 'Third grade, section B' },
          { name: '4A', podId: createdPods[2].id, gradeLevel: '4', description: 'Fourth grade, section A' },
          { name: '4B', podId: createdPods[3].id, gradeLevel: '4', description: 'Fourth grade, section B' }
        ];
        
        for (const classObj of classes) {
          await this.createClass(classObj);
        }
      }
      
      // Check if we already have behavior categories
      const existingCategories = await this.getAllBehaviorCategories();
      if (existingCategories.length === 0) {
        // Create behavior categories
        const categories = [
          { name: 'Academic Excellence', description: 'Outstanding academic performance', isPositive: true, pointValue: 5 },
          { name: 'Helping Others', description: 'Assisting peers or staff', isPositive: true, pointValue: 3 },
          { name: 'Teamwork', description: 'Great collaboration with others', isPositive: true, pointValue: 4 },
          { name: 'Leadership', description: 'Demonstrating leadership skills', isPositive: true, pointValue: 5 },
          { name: 'Classroom Disruption', description: 'Disrupting the learning environment', isPositive: false, pointValue: 2 },
          { name: 'Late Assignment', description: 'Submitting work after deadline', isPositive: false, pointValue: 1 },
          { name: 'Tardiness', description: 'Arriving late to class', isPositive: false, pointValue: 1 }
        ];
        
        for (const category of categories) {
          await this.createBehaviorCategory(category);
        }
      }
      
      // Check if we already have rewards
      const existingRewards = await this.getAllRewards();
      if (existingRewards.length === 0) {
        // Create rewards
        const rewards = [
          { name: 'Homework Pass', description: 'Skip one homework assignment', pointCost: 20, quantity: 10, imageUrl: '' },
          { name: 'Lunch with Teacher', description: 'Have lunch with your favorite teacher', pointCost: 30, quantity: 5, imageUrl: '' },
          { name: 'School Store Voucher', description: '$5 voucher for the school store', pointCost: 25, quantity: 15, imageUrl: '' },
          { name: 'Front of Lunch Line Pass', description: 'Skip the lunch line for a week', pointCost: 15, quantity: 20, imageUrl: '' }
        ];
        
        for (const reward of rewards) {
          await this.createReward(reward);
        }
      }
      
      // Check if we have any admin users
      const adminUsers = await this.getUsersByRole('admin');
      if (adminUsers.length === 0) {
        try {
          // Skip this since we've already created an admin user through our script
          console.log('Admin account creation skipped - create using scripts/create_admin.js instead');
        } catch (err) {
          console.error('Failed to handle admin user creation:', err);
        }
      }
    } catch (error) {
      console.error("Error initializing demo data:", error);
    }
  }
  
  // Pod methods
  async getPod(id: number): Promise<Pod | undefined> {
    try {
      const result = await db.select().from(pods).where(eq(pods.id, id));
      return result[0] || undefined;
    } catch (error) {
      console.error(`Error in getPod for ID ${id}:`, error);
      throw error;
    }
  }
  
  async getPodByName(name: string): Promise<Pod | undefined> {
    try {
      const result = await db.select().from(pods).where(eq(pods.name, name));
      return result[0] || undefined;
    } catch (error) {
      console.error(`Error in getPodByName for name ${name}:`, error);
      throw error;
    }
  }
  
  async createPod(pod: InsertPod): Promise<Pod> {
    try {
      const result = await db.insert(pods).values(pod).returning();
      if (!result || result.length === 0) {
        throw new Error('Failed to insert pod');
      }
      return result[0];
    } catch (error) {
      console.error('Error creating pod:', error);
      throw error;
    }
  }
  
  async updatePod(id: number, podUpdate: Partial<Pod>): Promise<Pod | undefined> {
    try {
      const result = await db.update(pods)
        .set(podUpdate)
        .where(eq(pods.id, id))
        .returning();
      
      return result[0] || undefined;
    } catch (error) {
      console.error(`Error in updatePod for ID ${id}:`, error);
      throw error;
    }
  }
  
  async deletePod(id: number): Promise<boolean> {
    try {
      const result = await db.delete(pods).where(eq(pods.id, id)).returning({ id: pods.id });
      return result.length > 0;
    } catch (error) {
      console.error(`Error in deletePod for ID ${id}:`, error);
      throw error;
    }
  }
  
  async getAllPods(): Promise<Pod[]> {
    try {
      return await db.select().from(pods);
    } catch (error) {
      console.error('Error in getAllPods:', error);
      throw error;
    }
  }
  
  async updatePodPoints(id: number, points: number): Promise<Pod | undefined> {
    try {
      const existingPod = await this.getPod(id);
      if (!existingPod) return undefined;
      
      const newPoints = existingPod.points + points;
      
      const result = await db.update(pods)
        .set({ points: newPoints })
        .where(eq(pods.id, id))
        .returning();
      
      return result[0] || undefined;
    } catch (error) {
      console.error(`Error in updatePodPoints for ID ${id}:`, error);
      throw error;
    }
  }
  
  // Class methods
  async getClass(id: number): Promise<Class | undefined> {
    try {
      const result = await db.select().from(classes).where(eq(classes.id, id));
      return result[0] || undefined;
    } catch (error) {
      console.error(`Error in getClass for ID ${id}:`, error);
      throw error;
    }
  }
  
  async getClassesByPodId(podId: number): Promise<Class[]> {
    try {
      return await db.select().from(classes).where(eq(classes.podId, podId));
    } catch (error) {
      console.error(`Error in getClassesByPodId for podId ${podId}:`, error);
      throw error;
    }
  }
  
  async createClass(classObj: InsertClass): Promise<Class> {
    try {
      const result = await db.insert(classes).values(classObj).returning();
      if (!result || result.length === 0) {
        throw new Error('Failed to insert class');
      }
      return result[0];
    } catch (error) {
      console.error('Error creating class:', error);
      throw error;
    }
  }
  
  async updateClass(id: number, classUpdate: Partial<Class>): Promise<Class | undefined> {
    try {
      const result = await db.update(classes)
        .set(classUpdate)
        .where(eq(classes.id, id))
        .returning();
      
      return result[0] || undefined;
    } catch (error) {
      console.error(`Error in updateClass for ID ${id}:`, error);
      throw error;
    }
  }
  
  async deleteClass(id: number): Promise<boolean> {
    try {
      const result = await db.delete(classes).where(eq(classes.id, id)).returning({ id: classes.id });
      return result.length > 0;
    } catch (error) {
      console.error(`Error in deleteClass for ID ${id}:`, error);
      throw error;
    }
  }
  
  async getAllClasses(): Promise<Class[]> {
    try {
      return await db.select().from(classes);
    } catch (error) {
      console.error('Error in getAllClasses:', error);
      throw error;
    }
  }
  
  // Student methods by pod and class
  async getStudentsByPodId(podId: number): Promise<User[]> {
    try {
      const result = await db.select()
        .from(users)
        .where(and(
          eq(users.role, 'student'),
          eq(users.podId, podId)
        ));
      
      return result.map(user => ensureUserType(user));
    } catch (error) {
      console.error(`Error in getStudentsByPodId for podId ${podId}:`, error);
      throw error;
    }
  }
  
  async getStudentsByClassId(classId: number): Promise<User[]> {
    try {
      const result = await db.select()
        .from(users)
        .where(and(
          eq(users.role, 'student'),
          eq(users.classId, classId)
        ));
      
      return result.map(user => ensureUserType(user));
    } catch (error) {
      console.error(`Error in getStudentsByClassId for classId ${classId}:`, error);
      throw error;
    }
  }
  
  // User Management
  async getUser(id: number): Promise<User | undefined> {
    // Validate id is a proper number before querying the database
    if (isNaN(id) || id === null || id === undefined) {
      console.warn(`Invalid user ID (${id}) passed to getUser`);
      return undefined;
    }
    
    try {
      // Use direct SQL query to avoid schema mismatch issues
      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT id, username, password, first_name AS "firstName", last_name AS "lastName", role, email, grade_level AS "gradeLevel", section, parent_id AS "parentId", pod_id AS "podId", class_id AS "classId" FROM users WHERE id = $1',
          [id]
        );
        
        if (result.rows.length === 0) {
          return undefined;
        }
        
        // Use our helper function to ensure correct typing
        const user = result.rows[0];
        return ensureUserType(user);
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error(`Error in getUser for ID ${id}:`, error.message || 'Unknown error');
      throw error; // Re-throw to allow the caller to handle
    }
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT id, username, password, first_name AS "firstName", last_name AS "lastName", role, email, grade_level AS "gradeLevel", section, parent_id AS "parentId", pod_id AS "podId", class_id AS "classId" FROM users WHERE username = $1',
          [username]
        );
        
        if (result.rows.length === 0) {
          return undefined;
        }
        
        // Use our helper function to ensure correct typing
        const user = result.rows[0];
        return ensureUserType(user);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error in getUserByUsername for username ${username}:`, error);
      throw error;
    }
  }
  
  async createUser(user: InsertUser): Promise<User> {
    try {
      // Explicitly returning PostgreSQL table data with proper typing
      const result = await db.insert(users).values(user).returning({
        id: users.id,
        username: users.username,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        email: users.email,
        gradeLevel: users.gradeLevel,
        section: users.section,
        parentId: users.parentId,
        podId: users.podId,
        classId: users.classId
      });
      
      if (!result || result.length === 0) {
        throw new Error('Failed to insert user - no results returned');
      }
      
      const userResult = result[0];
      
      // Use our helper function to ensure correct typing
      return ensureUserType(userResult);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    try {
      const client = await pool.connect();
      try {
        // Build the SQL update statement dynamically based on the fields in userUpdate
        let updateFields = [];
        let updateValues = [];
        let paramCounter = 1;
        
        // Map property names to DB column names
        const columnMap: Record<string, string> = {
          firstName: 'first_name',
          lastName: 'last_name',
          gradeLevel: 'grade_level',
          parentId: 'parent_id',
          podId: 'pod_id',
          classId: 'class_id'
        };
        
        for (const [key, value] of Object.entries(userUpdate)) {
          // Skip undefined values
          if (value === undefined) continue;
          
          // Map property name to column name if needed
          const columnName = columnMap[key] || key;
          updateFields.push(`${columnName} = $${paramCounter}`);
          updateValues.push(value);
          paramCounter++;
        }
        
        // If no valid update fields, return the existing user
        if (updateFields.length === 0) {
          return await this.getUser(id);
        }
        
        // Add the WHERE parameter
        updateValues.push(id);
        
        // Execute the update with pod_id and class_id
        const sql = `
          UPDATE users 
          SET ${updateFields.join(', ')} 
          WHERE id = $${paramCounter} 
          RETURNING id, username, password, first_name AS "firstName", last_name AS "lastName", 
                   role, email, grade_level AS "gradeLevel", section, 
                   parent_id AS "parentId", pod_id AS "podId", class_id AS "classId"
        `;
        
        const result = await client.query(sql, updateValues);
        
        if (result.rows.length === 0) {
          return undefined;
        }
        
        // Use our helper function to ensure correct typing
        const user = result.rows[0];
        return ensureUserType(user);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error in updateUser for ID ${id}:`, error);
      throw error;
    }
  }
  
  async deleteUser(id: number, forceDelete: boolean = false): Promise<boolean> {
    try {
      console.log(`Starting user deletion process for user ID: ${id}`);
      
      // Check if user exists before attempting deletion
      const userExists = await this.getUser(id);
      if (!userExists) {
        console.error(`User ID ${id} not found. Cannot delete non-existent user.`);
        return false;
      }
      
      console.log(`User exists: ${JSON.stringify(userExists)}`);
      
      // Start a transaction to ensure data consistency
      const client = await pool.connect();
      console.log(`Database client acquired for user ${id} deletion`);
      
      try {
        await client.query('BEGIN');
        console.log(`Transaction started for user ${id} deletion`);
        
        // First check if user has any associated behavior points
        const bpCheck = await client.query(
          'SELECT COUNT(*) FROM behavior_points WHERE student_id = $1',
          [id]
        );
        const bpCount = parseInt(bpCheck.rows[0].count);
        console.log(`Found ${bpCount} behavior points for student ${id}`);
        
        // Delete behavior points for this student
        if (bpCount > 0) {
          console.log(`Deleting ${bpCount} behavior points for student ${id}`);
          const bpResult = await client.query(
            'DELETE FROM behavior_points WHERE student_id = $1',
            [id]
          );
          console.log(`Deleted ${bpResult.rowCount} behavior points for student ${id}`);
        }
        
        // Check if user has any associated reward redemptions
        const rrCheck = await client.query(
          'SELECT COUNT(*) FROM reward_redemptions WHERE student_id = $1',
          [id]
        );
        const rrCount = parseInt(rrCheck.rows[0].count);
        console.log(`Found ${rrCount} reward redemptions for student ${id}`);
        
        // Delete reward redemptions for this student
        if (rrCount > 0) {
          console.log(`Deleting ${rrCount} reward redemptions for student ${id}`);
          const rrResult = await client.query(
            'DELETE FROM reward_redemptions WHERE student_id = $1',
            [id]
          );
          console.log(`Deleted ${rrResult.rowCount} reward redemptions for student ${id}`);
        }
        
        // Finally delete the user
        console.log(`Now deleting user ${id}`);
        const deleteResult = await client.query(
          'DELETE FROM users WHERE id = $1 RETURNING id',
          [id]
        );
        console.log(`User delete result: ${JSON.stringify(deleteResult.rows)}`);
        
        // Check if we actually deleted anything
        if (deleteResult.rowCount === 0 || deleteResult.rowCount === null) {
          console.error(`Failed to delete user ${id} - no rows affected`);
          throw new Error(`Failed to delete user ${id}`);
        }
        
        // Commit the transaction
        await client.query('COMMIT');
        console.log(`Transaction committed - successfully deleted user ${id} with all associated records`);
        
        return true;
      } catch (txError: any) {
        // Roll back in case of any errors
        console.error(`Error during transaction, rolling back: ${txError.message || 'Unknown error'}`);
        if (txError.stack) console.error(txError.stack);
        await client.query('ROLLBACK');
        throw txError;
      } finally {
        // Always release the client back to the pool
        client.release();
        console.log(`Database client released for user ${id} deletion`);
      }
    } catch (error: any) {
      console.error(`Error in deleteUser for user ID ${id}:`, error);
      if (error?.stack) console.error(error.stack);
      return false;
    }
  }
  
  async getAllUsers(): Promise<User[]> {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT id, username, password, first_name AS "firstName", last_name AS "lastName", role, email, grade_level AS "gradeLevel", section, parent_id AS "parentId", pod_id AS "podId", class_id AS "classId" FROM users'
        );
        
        // Use our helper function to ensure correct typing for each user
        const users = result.rows.map(user => ensureUserType(user));
        
        return users as User[];
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw error;
    }
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    try {
      const client = await pool.connect();
      try {
        let sql = 'SELECT id, username, password, first_name AS "firstName", last_name AS "lastName", role, email, grade_level AS "gradeLevel", section, parent_id AS "parentId", pod_id AS "podId", class_id AS "classId" FROM users';
        
        let result;
        if (role !== 'all') {
          sql += ' WHERE role = $1';
          result = await client.query(sql, [role]);
        } else {
          result = await client.query(sql);
        }
        
        // Use our helper function to ensure correct typing
        const users = result.rows.map(user => ensureUserType(user));
        
        return users as User[];
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error in getUsersByRole for role ${role}:`, error);
      throw error;
    }
  }
  
  async getStudentsByParentId(parentId: number): Promise<User[]> {
    // Validate parentId
    if (isNaN(parentId) || parentId === null || parentId === undefined) {
      console.warn(`Invalid parent ID (${parentId}) passed to getStudentsByParentId`);
      return [];
    }
    
    try {
      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT id, username, password, first_name AS "firstName", last_name AS "lastName", role, email, grade_level AS "gradeLevel", section, parent_id AS "parentId", pod_id AS "podId", class_id AS "classId" FROM users WHERE role = $1 AND parent_id = $2',
          ['student', parentId]
        );
        
        // Use our helper function to ensure correct typing
        const users = result.rows.map(user => ensureUserType(user));
        
        return users as User[];
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error(`Error in getStudentsByParentId for parentId ${parentId}:`, error.message || 'Unknown error');
      throw error;
    }
  }
  
  // We don't need getStudentsByHouseId anymore since we have getStudentsByPodId and getStudentsByClassId
  
  // Behavior Categories
  async getBehaviorCategory(id: number): Promise<BehaviorCategory | undefined> {
    const result = await db.select().from(behaviorCategories).where(eq(behaviorCategories.id, id));
    return result[0] as BehaviorCategory | undefined;
  }
  
  async createBehaviorCategory(category: InsertBehaviorCategory): Promise<BehaviorCategory> {
    const result = await db.insert(behaviorCategories).values(category).returning();
    return result[0] as BehaviorCategory;
  }
  
  async getAllBehaviorCategories(): Promise<BehaviorCategory[]> {
    const result = await db.select().from(behaviorCategories);
    return result as BehaviorCategory[];
  }
  
  async updateBehaviorCategory(id: number, categoryUpdate: Partial<BehaviorCategory>): Promise<BehaviorCategory | undefined> {
    const result = await db.update(behaviorCategories)
      .set(categoryUpdate)
      .where(eq(behaviorCategories.id, id))
      .returning();
    return result[0] as BehaviorCategory | undefined;
  }
  
  async deleteBehaviorCategory(id: number): Promise<boolean> {
    try {
      const result = await db.delete(behaviorCategories)
        .where(eq(behaviorCategories.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error in deleteBehaviorCategory:", error);
      return false;
    }
  }
  
  async getBehaviorPointsByCategoryId(categoryId: number): Promise<BehaviorPoint[]> {
    const result = await db.select()
      .from(behaviorPoints)
      .where(eq(behaviorPoints.categoryId, categoryId))
      .orderBy(desc(behaviorPoints.timestamp));
    return result as BehaviorPoint[];
  }
  
  // Behavior Points
  async createBehaviorPoint(point: InsertBehaviorPoint): Promise<BehaviorPoint> {
    const result = await db.insert(behaviorPoints).values({
      ...point,
      timestamp: new Date()
    }).returning();
    
    // Use raw SQL to update pod points based on student's pod or class
    try {
      const client = await pool.connect();
      try {
        // Check if student has direct pod association or class association
        const studentResult = await client.query(
          'SELECT pod_id, class_id FROM users WHERE id = $1 AND role = $2',
          [point.studentId, 'student']
        );
        
        if (studentResult.rows.length > 0) {
          const userData = studentResult.rows[0];
          let podId = null;
          
          // Direct pod association
          if (userData.pod_id) {
            podId = userData.pod_id;
          } 
          // Get pod through class association
          else if (userData.class_id) {
            const classResult = await client.query(
              'SELECT pod_id FROM classes WHERE id = $1',
              [userData.class_id]
            );
            
            if (classResult.rows.length > 0 && classResult.rows[0].pod_id) {
              podId = classResult.rows[0].pod_id;
            }
          }
          
          // Update pod points if we found a pod association
          if (podId) {
            await this.updatePodPoints(podId, point.points);
          }
        }
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error updating pod points for student ${point.studentId}:`, error);
    }
    
    return result[0] as BehaviorPoint;
  }
  
  async getBehaviorPointsByStudentId(studentId: number): Promise<BehaviorPoint[]> {
    const result = await db.select().from(behaviorPoints)
      .where(eq(behaviorPoints.studentId, studentId))
      .orderBy(desc(behaviorPoints.timestamp));
    return result as BehaviorPoint[];
  }
  
  async getBehaviorPointsByTeacherId(teacherId: number): Promise<BehaviorPoint[]> {
    const result = await db.select().from(behaviorPoints)
      .where(eq(behaviorPoints.teacherId, teacherId))
      .orderBy(desc(behaviorPoints.timestamp));
    return result as BehaviorPoint[];
  }
  
  async getRecentBehaviorPoints(limit: number): Promise<BehaviorPoint[]> {
    const result = await db.select().from(behaviorPoints)
      .orderBy(desc(behaviorPoints.timestamp))
      .limit(limit);
    return result as BehaviorPoint[];
  }
  
  async deleteAllBehaviorPoints(): Promise<void> {
    try {
      // Use a transaction to ensure data consistency
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Delete all behavior points
        await client.query('DELETE FROM behavior_points');
        
        // Reset all pod points to 0
        await client.query('UPDATE pods SET points = 0');
        
        await client.query('COMMIT');
        console.log('Successfully deleted all behavior points and reset pod points');
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting all behavior points:', error);
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error in deleteAllBehaviorPoints:', error);
      throw error;
    }
  }
  
  async deleteBehaviorPointsByStudentId(studentId: number): Promise<void> {
    try {
      // Use a transaction to ensure data consistency
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Get the student's pod (directly or through class)
        const studentResult = await client.query(
          'SELECT pod_id, class_id FROM users WHERE id = $1 AND role = $2',
          [studentId, 'student']
        );
        
        let podId = null;
        if (studentResult.rows.length > 0) {
          // Direct pod association
          if (studentResult.rows[0].pod_id) {
            podId = studentResult.rows[0].pod_id;
          } 
          // Get pod through class association
          else if (studentResult.rows[0].class_id) {
            const classResult = await client.query(
              'SELECT pod_id FROM classes WHERE id = $1',
              [studentResult.rows[0].class_id]
            );
            
            if (classResult.rows.length > 0 && classResult.rows[0].pod_id) {
              podId = classResult.rows[0].pod_id;
            }
          }
          
          if (podId) {
            // Calculate the total points to remove from the pod
            const pointsResult = await client.query(
              'SELECT SUM(points) as total_points FROM behavior_points WHERE student_id = $1',
              [studentId]
            );
            
            if (pointsResult.rows.length > 0 && pointsResult.rows[0].total_points) {
              const totalPoints = parseInt(pointsResult.rows[0].total_points);
              
              // Get current pod points and update
              const podResult = await client.query(
                'SELECT points FROM pods WHERE id = $1',
                [podId]
              );
              
              if (podResult.rows.length > 0) {
                const currentPoints = parseInt(podResult.rows[0].points);
                const newPoints = currentPoints - totalPoints;
                
                // Update pod points (ensure it doesn't go below 0)
                await client.query(
                  'UPDATE pods SET points = GREATEST(0, $1) WHERE id = $2',
                  [newPoints, podId]
                );
              }
            }
          }
        }
        
        // Delete behavior points for this student
        await client.query(
          'DELETE FROM behavior_points WHERE student_id = $1',
          [studentId]
        );
        
        await client.query('COMMIT');
        console.log(`Successfully deleted behavior points for student ${studentId}`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error deleting behavior points for student ${studentId}:`, error);
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error in deleteBehaviorPointsByStudentId for student ${studentId}:`, error);
      throw error;
    }
  }
  
  // Rewards
  async getReward(id: number): Promise<Reward | undefined> {
    const result = await db.select().from(rewards).where(eq(rewards.id, id));
    return result[0] as Reward | undefined;
  }
  
  async createReward(reward: InsertReward): Promise<Reward> {
    const result = await db.insert(rewards).values(reward).returning();
    return result[0] as Reward;
  }
  
  async updateReward(id: number, rewardUpdate: Partial<Reward>): Promise<Reward | undefined> {
    const result = await db.update(rewards)
      .set(rewardUpdate)
      .where(eq(rewards.id, id))
      .returning();
    return result[0] as Reward | undefined;
  }
  
  async getAllRewards(): Promise<Reward[]> {
    const result = await db.select().from(rewards);
    return result as Reward[];
  }
  
  // Reward Redemptions
  async createRewardRedemption(redemption: InsertRewardRedemption): Promise<RewardRedemption> {
    const result = await db.insert(rewardRedemptions).values({
      ...redemption,
      timestamp: new Date(),
      status: 'pending'
    }).returning();
    
    // Decrement reward quantity
    const reward = await this.getReward(redemption.rewardId);
    if (reward && reward.quantity > 0) {
      await this.updateReward(reward.id, { quantity: reward.quantity - 1 });
    }
    
    return result[0] as RewardRedemption;
  }
  
  async getRewardRedemptionsByStudentId(studentId: number): Promise<RewardRedemption[]> {
    const result = await db.select().from(rewardRedemptions)
      .where(eq(rewardRedemptions.studentId, studentId))
      .orderBy(desc(rewardRedemptions.timestamp));
    return result as RewardRedemption[];
  }
  
  async updateRewardRedemptionStatus(id: number, status: "pending" | "approved" | "delivered"): Promise<RewardRedemption | undefined> {
    const result = await db.update(rewardRedemptions)
      .set({ status: status as any }) // Cast to any to work around type issues with Drizzle
      .where(eq(rewardRedemptions.id, id))
      .returning();
    return result[0] as RewardRedemption | undefined;
  }
  
  // Incident report methods
  async createIncidentReport(report: InsertIncidentReport): Promise<IncidentReport> {
    try {
      // Ensure studentIds is properly formatted as a JSON array
      if (!Array.isArray(report.studentIds)) {
        throw new Error('studentIds must be an array');
      }

      // Use a client connection for direct SQL control
      const client = await pool.connect();
      try {
        // Create the incident report using parameterized query
        const result = await client.query(
          `INSERT INTO incident_reports 
           (teacher_id, student_ids, type, description, action_taken, incident_date, attachment_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            report.teacherId,
            JSON.stringify(report.studentIds),
            report.type,
            report.description,
            report.actionTaken || null,
            report.incidentDate || new Date(),
            report.attachmentUrl || null
          ]
        );
        
        if (result.rows.length === 0) {
          throw new Error('Failed to create incident report');
        }
        
        // Transform the result back to camelCase
        const row = result.rows[0];
        return {
          id: row.id,
          teacherId: row.teacher_id,
          studentIds: row.student_ids,
          type: row.type,
          description: row.description,
          status: row.status,
          adminResponse: row.admin_response,
          adminId: row.admin_id,
          incidentDate: row.incident_date,
          attachmentUrl: row.attachment_url,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        } as IncidentReport;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating incident report:', error);
      throw error;
    }
  }
  
  async getIncidentReport(id: number): Promise<IncidentReport | undefined> {
    try {
      // Use a client connection for direct SQL control
      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT * FROM incident_reports WHERE id = $1',
          [id]
        );
        
        if (result.rows.length === 0) {
          return undefined;
        }
        
        // Transform the snake_case column names to camelCase
        const row = result.rows[0];
        return {
          id: row.id,
          teacherId: row.teacher_id,
          studentIds: row.student_ids,
          type: row.type,
          description: row.description,
          actionTaken: row.action_taken,
          status: row.status,
          adminResponse: row.admin_response,
          adminId: row.admin_id,
          incidentDate: row.incident_date,
          attachmentUrl: row.attachment_url,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        } as IncidentReport;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error retrieving incident report with ID ${id}:`, error);
      throw error;
    }
  }
  
  async getIncidentReportsByTeacherId(teacherId: number): Promise<IncidentReport[]> {
    try {
      // Use a client connection to get direct SQL control 
      const client = await pool.connect();
      try {
        const result = await client.query(
          `SELECT * FROM incident_reports 
           WHERE teacher_id = $1
           ORDER BY incident_date DESC`,
          [teacherId]
        );
        
        // Transform the snake_case column names to camelCase
        return result.rows.map(row => ({
          id: row.id,
          teacherId: row.teacher_id,
          studentIds: row.student_ids,
          type: row.type,
          description: row.description,
          actionTaken: row.action_taken,
          status: row.status,
          adminResponse: row.admin_response,
          adminId: row.admin_id,
          incidentDate: row.incident_date,
          attachmentUrl: row.attachment_url,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        })) as IncidentReport[];
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error retrieving incident reports for teacher ${teacherId}:`, error);
      throw error;
    }
  }
  
  async getIncidentReportsByStudentId(studentId: number): Promise<IncidentReport[]> {
    try {
      // This is a bit more complex since studentIds is a JSON array
      // We'll need to use a raw SQL query with a JSON containment check
      const client = await pool.connect();
      try {
        const result = await client.query(
          `SELECT * FROM incident_reports 
           WHERE student_ids @> '[${studentId}]'::jsonb
           ORDER BY incident_date DESC`
        );
        
        // Transform the snake_case column names to camelCase
        return result.rows.map(row => ({
          id: row.id,
          teacherId: row.teacher_id,
          studentIds: row.student_ids,
          type: row.type,
          description: row.description,
          actionTaken: row.action_taken,
          status: row.status,
          adminResponse: row.admin_response,
          adminId: row.admin_id,
          incidentDate: row.incident_date,
          attachmentUrl: row.attachment_url,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        })) as IncidentReport[];
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error retrieving incident reports for student ${studentId}:`, error);
      throw error;
    }
  }
  
  async getAllIncidentReports(): Promise<IncidentReport[]> {
    try {
      // Use a client connection to get direct SQL control
      const client = await pool.connect();
      try {
        const result = await client.query(
          `SELECT * FROM incident_reports 
           ORDER BY incident_date DESC`
        );
        
        // Transform the snake_case column names to camelCase
        return result.rows.map(row => ({
          id: row.id,
          teacherId: row.teacher_id,
          studentIds: row.student_ids,
          type: row.type,
          description: row.description,
          actionTaken: row.action_taken,
          status: row.status,
          adminResponse: row.admin_response,
          adminId: row.admin_id,
          incidentDate: row.incident_date,
          attachmentUrl: row.attachment_url,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        })) as IncidentReport[];
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error retrieving all incident reports:', error);
      throw error;
    }
  }
  
  async updateIncidentReport(id: number, reportUpdate: Partial<IncidentReport>): Promise<IncidentReport | undefined> {
    try {
      // Use a client connection for direct SQL control
      const client = await pool.connect();
      try {
        // Start by getting the existing record
        const getResult = await client.query(
          'SELECT * FROM incident_reports WHERE id = $1',
          [id]
        );
        
        if (getResult.rows.length === 0) {
          return undefined;
        }
        
        // Prepare the update data, converting camelCase to snake_case
        const updateData: Record<string, any> = {
          updated_at: new Date()
        };
        
        if (reportUpdate.teacherId !== undefined) updateData.teacher_id = reportUpdate.teacherId;
        if (reportUpdate.studentIds !== undefined) updateData.student_ids = reportUpdate.studentIds;
        if (reportUpdate.type !== undefined) updateData.type = reportUpdate.type;
        if (reportUpdate.description !== undefined) updateData.description = reportUpdate.description;
        if (reportUpdate.actionTaken !== undefined) updateData.action_taken = reportUpdate.actionTaken;
        if (reportUpdate.status !== undefined) updateData.status = reportUpdate.status;
        if (reportUpdate.adminResponse !== undefined) updateData.admin_response = reportUpdate.adminResponse;
        if (reportUpdate.adminId !== undefined) updateData.admin_id = reportUpdate.adminId;
        if (reportUpdate.incidentDate !== undefined) updateData.incident_date = reportUpdate.incidentDate;
        if (reportUpdate.attachmentUrl !== undefined) updateData.attachment_url = reportUpdate.attachmentUrl;
        
        // Build the SET clause for the SQL update
        const setClause = Object.entries(updateData)
          .map(([key, _], index) => `${key} = $${index + 2}`)
          .join(', ');
        
        const values = [id, ...Object.values(updateData)];
        
        // Execute the update
        const result = await client.query(
          `UPDATE incident_reports 
           SET ${setClause}
           WHERE id = $1
           RETURNING *`,
          values
        );
        
        // Transform the result back to camelCase
        if (result.rows.length > 0) {
          const row = result.rows[0];
          return {
            id: row.id,
            teacherId: row.teacher_id,
            studentIds: row.student_ids,
            type: row.type,
            description: row.description,
            actionTaken: row.action_taken,
            status: row.status,
            adminResponse: row.admin_response,
            adminId: row.admin_id,
            incidentDate: row.incident_date,
            attachmentUrl: row.attachment_url,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          } as IncidentReport;
        }
        
        return undefined;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error updating incident report ${id}:`, error);
      throw error;
    }
  }
  
  async deleteIncidentReport(id: number): Promise<boolean> {
    try {
      // Use a client connection for direct SQL control
      const client = await pool.connect();
      try {
        const result = await client.query(
          'DELETE FROM incident_reports WHERE id = $1 RETURNING id',
          [id]
        );
        return result.rows.length > 0;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error deleting incident report ${id}:`, error);
      throw error;
    }
  }
}

// Use PostgreSQL storage
export const storage = new DatabaseStorage();

// Uncomment to use in-memory storage
// export const storage = new MemStorage();

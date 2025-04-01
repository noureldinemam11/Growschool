import { users, houses, behaviorCategories, behaviorPoints, rewards, rewardRedemptions } from "@shared/schema";
import type { User, InsertUser, House, InsertHouse, BehaviorCategory, InsertBehaviorCategory, BehaviorPoint, InsertBehaviorPoint, Reward, InsertReward, RewardRedemption, InsertRewardRedemption, UserRole } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { and, eq, desc } from "drizzle-orm";
import { db, pool } from "./db";

// Create session stores
const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  getStudentsByParentId(parentId: number): Promise<User[]>;
  getStudentsByHouseId(houseId: number): Promise<User[]>;
  
  // House management
  getHouse(id: number): Promise<House | undefined>;
  getHouseByName(name: string): Promise<House | undefined>;
  createHouse(house: InsertHouse): Promise<House>;
  updateHouse(id: number, house: Partial<House>): Promise<House | undefined>;
  deleteHouse(id: number): Promise<boolean>;
  getAllHouses(): Promise<House[]>;
  updateHousePoints(id: number, points: number): Promise<House | undefined>;
  
  // Behavior categories
  getBehaviorCategory(id: number): Promise<BehaviorCategory | undefined>;
  createBehaviorCategory(category: InsertBehaviorCategory): Promise<BehaviorCategory>;
  getAllBehaviorCategories(): Promise<BehaviorCategory[]>;
  
  // Behavior points
  createBehaviorPoint(point: InsertBehaviorPoint): Promise<BehaviorPoint>;
  getBehaviorPointsByStudentId(studentId: number): Promise<BehaviorPoint[]>;
  getBehaviorPointsByTeacherId(teacherId: number): Promise<BehaviorPoint[]>;
  getRecentBehaviorPoints(limit: number): Promise<BehaviorPoint[]>;
  
  // Rewards
  getReward(id: number): Promise<Reward | undefined>;
  createReward(reward: InsertReward): Promise<Reward>;
  updateReward(id: number, reward: Partial<Reward>): Promise<Reward | undefined>;
  getAllRewards(): Promise<Reward[]>;
  
  // Reward redemptions
  createRewardRedemption(redemption: InsertRewardRedemption): Promise<RewardRedemption>;
  getRewardRedemptionsByStudentId(studentId: number): Promise<RewardRedemption[]>;
  updateRewardRedemptionStatus(id: number, status: "pending" | "approved" | "delivered"): Promise<RewardRedemption | undefined>;
  
  // Session store
  sessionStore: any; // Using any for session store type to avoid compatibility issues
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private houses: Map<number, House>;
  private behaviorCategories: Map<number, BehaviorCategory>;
  private behaviorPoints: Map<number, BehaviorPoint>;
  private rewards: Map<number, Reward>;
  private rewardRedemptions: Map<number, RewardRedemption>;
  
  sessionStore: any; // Using any instead of session.SessionStore
  
  private userCurrentId: number;
  private houseCurrentId: number;
  private categoryCurrentId: number;
  private pointCurrentId: number;
  private rewardCurrentId: number;
  private redemptionCurrentId: number;

  constructor() {
    this.users = new Map();
    this.houses = new Map();
    this.behaviorCategories = new Map();
    this.behaviorPoints = new Map();
    this.rewards = new Map();
    this.rewardRedemptions = new Map();
    
    this.userCurrentId = 1;
    this.houseCurrentId = 1;
    this.categoryCurrentId = 1;
    this.pointCurrentId = 1;
    this.rewardCurrentId = 1;
    this.redemptionCurrentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Initialize with demo data
    this.initializeDemo();
  }

  private initializeDemo() {
    // Create houses
    const houses = [
      { name: 'Phoenix', color: '#3b82f6', description: 'House of courage and rebirth', logoUrl: '' },
      { name: 'Griffin', color: '#10b981', description: 'House of nobility and strength', logoUrl: '' },
      { name: 'Dragon', color: '#f59e0b', description: 'House of wisdom and power', logoUrl: '' },
      { name: 'Pegasus', color: '#ef4444', description: 'House of freedom and inspiration', logoUrl: '' }
    ];
    
    houses.forEach(house => this.createHouse(house));
    
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
      houseId: typeof insertUser.houseId === 'number' ? insertUser.houseId : null,
      parentId: typeof insertUser.parentId === 'number' ? insertUser.parentId : null
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

  async getStudentsByHouseId(houseId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => 
      user.role === 'student' && user.houseId === houseId
    );
  }

  // House methods
  async getHouse(id: number): Promise<House | undefined> {
    return this.houses.get(id);
  }

  async getHouseByName(name: string): Promise<House | undefined> {
    return Array.from(this.houses.values()).find(
      (house) => house.name === name
    );
  }

  async createHouse(house: InsertHouse): Promise<House> {
    const id = this.houseCurrentId++;
    const newHouse: House = {
      id,
      name: house.name,
      color: house.color,
      points: 0,
      description: house.description || null,
      logoUrl: house.logoUrl || null
    };
    this.houses.set(id, newHouse);
    return newHouse;
  }

  async updateHouse(id: number, houseUpdate: Partial<House>): Promise<House | undefined> {
    const house = this.houses.get(id);
    if (!house) return undefined;
    
    const updatedHouse = { ...house, ...houseUpdate };
    this.houses.set(id, updatedHouse);
    return updatedHouse;
  }
  
  async deleteHouse(id: number): Promise<boolean> {
    if (!this.houses.has(id)) return false;
    return this.houses.delete(id);
  }

  async getAllHouses(): Promise<House[]> {
    return Array.from(this.houses.values());
  }

  async updateHousePoints(id: number, points: number): Promise<House | undefined> {
    const house = this.houses.get(id);
    if (!house) return undefined;
    
    const updatedHouse = { ...house, points: house.points + points };
    this.houses.set(id, updatedHouse);
    return updatedHouse;
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
    
    // Update house points if student is in a house
    const student = await this.getUser(point.studentId);
    if (student && student.houseId) {
      await this.updateHousePoints(student.houseId, point.points);
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
      // Check if we already have houses
      const existingHouses = await this.getAllHouses();
      if (existingHouses.length === 0) {
        // Create houses
        const houses = [
          { name: 'Phoenix', color: '#3b82f6', description: 'House of courage and rebirth', logoUrl: '' },
          { name: 'Griffin', color: '#10b981', description: 'House of nobility and strength', logoUrl: '' },
          { name: 'Dragon', color: '#f59e0b', description: 'House of wisdom and power', logoUrl: '' },
          { name: 'Pegasus', color: '#ef4444', description: 'House of freedom and inspiration', logoUrl: '' }
        ];
        
        for (const house of houses) {
          await this.createHouse(house);
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
  
  // User Management
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] as User | undefined;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0] as User | undefined;
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
        houseId: users.houseId,
        parentId: users.parentId
      });
      
      if (!result || result.length === 0) {
        throw new Error('Failed to insert user - no results returned');
      }
      
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userUpdate)
      .where(eq(users.id, id))
      .returning();
    return result[0] as User | undefined;
  }
  
  async getAllUsers(): Promise<User[]> {
    const result = await db.select().from(users);
    return result as User[];
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    const result = await db.select().from(users).where(eq(users.role, role));
    return result as User[];
  }
  
  async getStudentsByParentId(parentId: number): Promise<User[]> {
    const result = await db.select().from(users)
      .where(and(
        eq(users.role, 'student'),
        eq(users.parentId, parentId)
      ));
    return result as User[];
  }
  
  async getStudentsByHouseId(houseId: number): Promise<User[]> {
    const result = await db.select().from(users)
      .where(and(
        eq(users.role, 'student'),
        eq(users.houseId, houseId)
      ));
    return result as User[];
  }
  
  // House Management
  async getHouse(id: number): Promise<House | undefined> {
    const result = await db.select().from(houses).where(eq(houses.id, id));
    return result[0] as House | undefined;
  }
  
  async getHouseByName(name: string): Promise<House | undefined> {
    const result = await db.select().from(houses).where(eq(houses.name, name));
    return result[0] as House | undefined;
  }
  
  async createHouse(house: InsertHouse): Promise<House> {
    const result = await db.insert(houses).values({
      ...house,
      points: 0
    }).returning();
    return result[0] as House;
  }
  
  async updateHouse(id: number, houseUpdate: Partial<House>): Promise<House | undefined> {
    const result = await db.update(houses)
      .set(houseUpdate)
      .where(eq(houses.id, id))
      .returning();
    return result[0] as House | undefined;
  }
  
  async getAllHouses(): Promise<House[]> {
    const result = await db.select().from(houses);
    return result as House[];
  }
  
  async deleteHouse(id: number): Promise<boolean> {
    try {
      const result = await db.delete(houses)
        .where(eq(houses.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error in deleteHouse:", error);
      return false;
    }
  }
  
  async updateHousePoints(id: number, points: number): Promise<House | undefined> {
    const house = await this.getHouse(id);
    if (!house) return undefined;
    
    const newPoints = house.points + points;
    return await this.updateHouse(id, { points: newPoints });
  }
  
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
  
  // Behavior Points
  async createBehaviorPoint(point: InsertBehaviorPoint): Promise<BehaviorPoint> {
    const result = await db.insert(behaviorPoints).values({
      ...point,
      timestamp: new Date()
    }).returning();
    
    // Update house points if student is in a house
    const student = await this.getUser(point.studentId);
    if (student?.houseId) {
      await this.updateHousePoints(student.houseId, point.points);
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
}

// Use PostgreSQL storage
export const storage = new DatabaseStorage();

// Uncomment to use in-memory storage
// export const storage = new MemStorage();

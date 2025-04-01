import { users, houses, behaviorCategories, behaviorPoints, rewards, rewardRedemptions } from "@shared/schema";
import type { User, InsertUser, House, InsertHouse, BehaviorCategory, InsertBehaviorCategory, BehaviorPoint, InsertBehaviorPoint, Reward, InsertReward, RewardRedemption, InsertRewardRedemption } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

// Create memory store for sessions
const MemoryStore = createMemoryStore(session);

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
  updateRewardRedemptionStatus(id: number, status: string): Promise<RewardRedemption | undefined>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private houses: Map<number, House>;
  private behaviorCategories: Map<number, BehaviorCategory>;
  private behaviorPoints: Map<number, BehaviorPoint>;
  private rewards: Map<number, Reward>;
  private rewardRedemptions: Map<number, RewardRedemption>;
  
  sessionStore: session.SessionStore;
  
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
    const user: User = { ...insertUser, id };
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
    const newHouse: House = { ...house, id, points: 0 };
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
    const newCategory: BehaviorCategory = { ...category, id };
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
      ...point, 
      id,
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
    const newReward: Reward = { ...reward, id };
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

  async updateRewardRedemptionStatus(id: number, status: string): Promise<RewardRedemption | undefined> {
    const redemption = this.rewardRedemptions.get(id);
    if (!redemption) return undefined;
    
    const updatedRedemption = { ...redemption, status };
    this.rewardRedemptions.set(id, updatedRedemption);
    return updatedRedemption;
  }
}

export const storage = new MemStorage();

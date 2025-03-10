import { InsertUser, User, Survey } from "@shared/schema";
import { qualtricsSettingsSchema } from "@shared/schema";
import type { z } from "zod";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateQualtricsCredentials(
    userId: number,
    credentials: z.infer<typeof qualtricsSettingsSchema>
  ): Promise<void>;
  deductTokens(userId: number, amount: number): Promise<void>;
  createSurvey(survey: Omit<Survey, "id" | "createdAt">): Promise<Survey>;
  getUserSurveys(userId: number): Promise<Survey[]>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private surveys: Map<number, Survey>;
  private currentId: number;
  private currentSurveyId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.surveys = new Map();
    this.currentId = 1;
    this.currentSurveyId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = {
      ...insertUser,
      id,
      qualtricsApiToken: null,
      qualtricsDatacenter: null,
      qualtricsBrandId: null,
      tokenBalance: 100, // Give new users some free tokens
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateQualtricsCredentials(
    userId: number,
    credentials: z.infer<typeof qualtricsSettingsSchema>
  ): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    this.users.set(userId, {
      ...user,
      ...credentials,
    });
  }

  async deductTokens(userId: number, amount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    if (user.tokenBalance < amount) throw new Error("Insufficient tokens");

    this.users.set(userId, {
      ...user,
      tokenBalance: user.tokenBalance - amount,
    });
  }

  async createSurvey(survey: Omit<Survey, "id" | "createdAt">): Promise<Survey> {
    const id = this.currentSurveyId++;
    const newSurvey: Survey = {
      ...survey,
      id,
      createdAt: new Date(),
    };
    this.surveys.set(id, newSurvey);
    return newSurvey;
  }

  async getUserSurveys(userId: number): Promise<Survey[]> {
    return Array.from(this.surveys.values()).filter(
      (survey) => survey.userId === userId
    );
  }
}

export const storage = new MemStorage();
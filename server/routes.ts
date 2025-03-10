import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { generateSurvey, calculateTokenUsage } from "./openai";
import { QualtricsAPI } from "./qualtrics";
import { storage } from "./storage";
import { qualtricsSettingsSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Update Qualtrics credentials
  app.post("/api/settings/qualtrics", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const credentials = qualtricsSettingsSchema.parse(req.body);

      // Verify credentials
      const api = new QualtricsAPI(
        credentials.qualtricsApiToken,
        credentials.qualtricsDatacenter,
        credentials.qualtricsBrandId
      );

      const isValid = await api.verifyCredentials();
      if (!isValid) {
        return res.status(400).json({ message: "Invalid Qualtrics credentials" });
      }

      await storage.updateQualtricsCredentials(req.user.id, credentials);
      res.json({ message: "Credentials updated successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Generate survey
  app.post("/api/surveys/generate", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.qualtricsApiToken || !user.qualtricsDatacenter || !user.qualtricsBrandId) {
        return res.status(400).json({ message: "Qualtrics credentials not set" });
      }

      const tokenUsage = await calculateTokenUsage(prompt);
      if (user.tokenBalance < tokenUsage) {
        return res.status(400).json({ message: "Insufficient token balance" });
      }

      const surveyData = await generateSurvey(prompt);

      const api = new QualtricsAPI(
        user.qualtricsApiToken,
        user.qualtricsDatacenter,
        user.qualtricsBrandId
      );

      const surveyId = await api.createSurvey(surveyData);

      // Deduct tokens and save survey
      await storage.deductTokens(user.id, tokenUsage);
      await storage.createSurvey({
        userId: user.id,
        qualtricsId: surveyId,
        name: surveyData.title,
      });

      res.json({ surveyId, surveyData });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get user's surveys
  app.get("/api/surveys", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const surveys = await storage.getUserSurveys(req.user.id);
      res.json(surveys);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
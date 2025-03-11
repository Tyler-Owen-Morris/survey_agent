import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { generateSurvey, chatCompletion } from "./openai";
import { QualtricsAPI } from "./qualtrics";
import { storage } from "./storage";
import { qualtricsSettingsSchema } from "@shared/schema";
import Stripe from "stripe";
import * as express from 'express';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Chat completion endpoint
  app.post("/api/chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "Messages array is required" });
    }

    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has enough tokens
      if (user.tokenBalance <= 0) {
        return res.status(402).json({ 
          message: "Insufficient tokens. Please purchase more tokens or subscribe to continue.",
          tokenBalance: user.tokenBalance
        });
      }

      const response = await chatCompletion(messages);

      // Deduct tokens
      await storage.deductTokens(user.id, response.tokensUsed);

      // Get updated balance
      const updatedUser = await storage.getUser(req.user.id);

      res.json({ 
        message: response.message,
        tokenBalance: updatedUser?.tokenBalance || 0
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

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

      // Check token balance
      if (user.tokenBalance <= 0) {
        return res.status(402).json({ 
          message: "Insufficient tokens. Please purchase more tokens or subscribe to continue.",
          tokenBalance: user.tokenBalance
        });
      }

      const { data: surveyData, tokensUsed } = await generateSurvey(prompt);

      const api = new QualtricsAPI(
        user.qualtricsApiToken,
        user.qualtricsDatacenter,
        user.qualtricsBrandId
      );

      const surveyId = await api.createSurvey(surveyData);

      // Deduct tokens
      await storage.deductTokens(user.id, tokensUsed);

      await storage.createSurvey({
        userId: user.id,
        qualtricsId: surveyId,
        name: surveyData.title,
      });

      // Get updated balance
      const updatedUser = await storage.getUser(user.id);

      res.json({ 
        surveyId, 
        surveyData,
        tokenBalance: updatedUser?.tokenBalance || 0
      });
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

  // Stripe payment routes
  app.post("/api/create-payment-intent", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { type, amount } = req.body;

      if (type === "subscription") {
        // Create a subscription
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 2000, // $20.00
          currency: "usd",
          metadata: {
            userId: req.user.id,
            type: "subscription",
          },
        });
        res.json({ clientSecret: paymentIntent.client_secret });
      } else {
        // One-time token purchase
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 1000, // $10.00
          currency: "usd",
          metadata: {
            userId: req.user.id,
            type: "tokens",
          },
        });
        res.json({ clientSecret: paymentIntent.client_secret });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe webhook handling
  app.post("/api/webhooks/stripe", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).send('Webhook secret missing');
    }

    try {
      const event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET);

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const userId = parseInt(paymentIntent.metadata.userId);
        const type = paymentIntent.metadata.type;

        // Credit tokens based on purchase type
        if (type === "subscription") {
          await storage.addTokens(userId, 20000); // 20k tokens for subscription
        } else if (type === "tokens") {
          await storage.addTokens(userId, 10000); // 10k tokens for one-time purchase
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
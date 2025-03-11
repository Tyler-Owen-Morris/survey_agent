import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

dotenv.config();

console.log("env:", process.env);

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatCompletionResult {
  message: string;
  tokensUsed: number;
}

// Load the system prompt from JSON file
async function loadSystemPrompt(): Promise<Message[]> {
  try {
    const promptPath = path.join(__dirname, "prompts", "survey-chat.json");
    const promptData = await fs.readFile(promptPath, "utf-8");
    const { conversation } = JSON.parse(promptData);
    return conversation;
  } catch (error: any) {
    console.error("Error loading system prompt:", error.message);
    // Fallback to basic prompt if file can't be loaded
    return [
      {
        role: "system",
        content: "You are a helpful survey design expert. Help users design effective surveys by asking clarifying questions and providing suggestions.",
      },
    ];
  }
}

export async function chatCompletion(messages: Message[]): Promise<ChatCompletionResult> {
  try {
    const systemPrompt = await loadSystemPrompt();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [...systemPrompt, ...messages],
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("OpenAI returned empty response");
    }

    // Get total tokens used from the response
    const tokensUsed = response.usage?.total_tokens || 0;

    return {
      message: content,
      tokensUsed,
    };
  } catch (error: any) {
    throw new Error(`Chat completion failed: ${error.message}`);
  }
}

// Keep the existing survey generation code but add token tracking
export interface SurveyGenerationResponse {
  title: string;
  description: string;
  questions: Array<{
    type: string;
    text: string;
    choices?: string[];
    validation?: {
      required: boolean;
      min?: number;
      max?: number;
    };
  }>;
}

export async function generateSurvey(prompt: string): Promise<{
  data: SurveyGenerationResponse;
  tokensUsed: number;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a survey design expert. Generate a survey based on the user's requirements. Output should be a JSON object with title, description, and questions array.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("OpenAI returned empty response");
    }

    const tokensUsed = response.usage?.total_tokens || 0;
    const result = JSON.parse(content);

    return {
      data: result as SurveyGenerationResponse,
      tokensUsed,
    };
  } catch (error: any) {
    throw new Error(`Failed to generate survey: ${error.message}`);
  }
}

export async function calculateTokenUsage(text: string): Promise<number> {
  // Simple estimation: ~4 chars per token
  return Math.ceil(text.length / 4);
}
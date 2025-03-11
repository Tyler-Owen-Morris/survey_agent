import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
  throw new Error("Missing NEXT_PUBLIC_OPENAI_API_KEY environment variable");
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });


// Convert import.meta.url to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load chat context from JSON file
const chatContextPath = path.resolve(__dirname, "chat-context.json");
const chatContext = JSON.parse(fs.readFileSync(chatContextPath, "utf-8"));

export interface SurveyGenerationResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    logprobs: null | any;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_tokens_details: {
      cached_tokens: number;
      audio_tokens: number;
    };
    completion_tokens_details: {
      reasoning_tokens: number;
      audio_tokens: number;
      accepted_prediction_tokens: number;
      rejected_prediction_tokens: number;
    };
  };
  service_tier: string;
  system_fingerprint: string;
}

export async function sendToAI(prompt: string): Promise<SurveyGenerationResponse> {
  try {
    console.log("Sending to AI");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        ...chatContext,
        { role: "user", content: prompt },
      ],
    });
    console.log("Response received from AI", response.choices[0].message);

    // Directly return the response
    return response as SurveyGenerationResponse;
  } catch (error: any) {
    throw new Error(`Failed to generate survey: ${error.message}`);
  }
}

export async function calculateTokenUsage(text: string): Promise<number> {
  // Simple estimation: ~4 chars per token
  return Math.ceil(text.length / 4);
}
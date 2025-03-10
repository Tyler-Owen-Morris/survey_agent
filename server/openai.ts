import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

export async function generateSurvey(prompt: string): Promise<SurveyGenerationResponse> {
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

    const result = JSON.parse(content);
    return result as SurveyGenerationResponse;
  } catch (error: any) {
    throw new Error(`Failed to generate survey: ${error.message}`);
  }
}

export async function calculateTokenUsage(text: string): Promise<number> {
  // Simple estimation: ~4 chars per token
  return Math.ceil(text.length / 4);
}
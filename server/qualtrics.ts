import axios from "axios";
import { SurveyGenerationResponse } from "./openai";

export class QualtricsAPI {
  private apiToken: string;
  private datacenter: string;
  private brandId: string;

  constructor(apiToken: string, datacenter: string, brandId: string) {
    this.apiToken = apiToken;
    this.datacenter = datacenter;
    this.brandId = brandId;
  }

  private get baseUrl() {
    return `https://${this.datacenter}.qualtrics.com/API/v3`;
  }

  private get headers() {
    return {
      "X-API-TOKEN": this.apiToken,
      "Content-Type": "application/json",
    };
  }

  async verifyCredentials(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/whoami`, { headers: this.headers });
      return true;
    } catch (error) {
      return false;
    }
  }

  async createSurvey(surveyData: SurveyGenerationResponse): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/survey-definitions`,
        {
          name: surveyData.title,
          projectCategory: this.brandId,
        },
        { headers: this.headers }
      );

      const surveyId = response.data.result.id;

      // Add questions
      for (const question of surveyData.questions) {
        await this.addQuestion(surveyId, question);
      }

      return surveyId;
    } catch (error: any) {
      throw new Error(`Failed to create survey: ${error.message}`);
    }
  }

  private async addQuestion(surveyId: string, question: any) {
    try {
      await axios.post(
        `${this.baseUrl}/survey-definitions/${surveyId}/questions`,
        {
          questionText: question.text,
          questionType: this.mapQuestionType(question.type),
          choices: question.choices?.map((choice: string) => ({ text: choice })),
          validation: question.validation,
        },
        { headers: this.headers }
      );
    } catch (error: any) {
      throw new Error(`Failed to add question: ${error.message}`);
    }
  }

  private mapQuestionType(type: string): string {
    // Map our internal question types to Qualtrics types
    const typeMap: Record<string, string> = {
      "multiple_choice": "MC",
      "text": "TE",
      "rating": "Matrix",
      // Add more mappings as needed
    };
    return typeMap[type] || "TE";
  }
}

import { ai, logger } from "../config";

interface ExtractionResult {
  skills: string[];
  experience: string;
  jobType: string;
  summary: string;
  preferredRoles: string[];
  location: string;
}

export class GeminiService {
  /**
   * Extract skills and profile details from unstructured text/voice input
   */
  static async extractSkills(input: string): Promise<ExtractionResult> {
    try {
      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: `Extract profile details from the following user input: "${input}"`,
        config: {
          systemInstruction: `You are an expert recruitment assistant for the Indian informal sector (construction, trades, factories).
          Analyze the input and extract technical/soft skills, years/description of experience, the main job type (trade), a short professional summary, preferred job roles, and mention of location.
          Return strictly as valid JSON.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              skills: { type: "array", items: { type: "string" } },
              experience: { type: "string" },
              jobType: { type: "string" },
              summary: { type: "string" },
              preferredRoles: { type: "array", items: { type: "string" } },
              location: { type: "string" }
            },
            required: ["skills", "experience", "jobType", "summary", "preferredRoles", "location"]
          }
        }
      });
      return JSON.parse(result.text);
    } catch (error) {
      logger.error("Skill extraction failed", error);
      throw new Error("Failed to process intelligence request");
    }
  }

  /**
   * Generate a professional markdown resume
   */
  static async generateResume(profile: any): Promise<{ markdown: string; linkedInSummary: string }> {
    try {
      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: `Generate a resume for this profile: ${JSON.stringify(profile)}`,
        config: {
          systemInstruction: `Generate a professional, high-impact markdown resume for an Indian industrial worker.
          Include a Clean Header, Skills Matrix, Experience History, and a Unique Value Proposition.
          Also provide a 3-sentence LinkedIn Summary.
          Return strictly as valid JSON with fields "markdown" and "linkedInSummary".`,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              markdown: { type: "string" },
              linkedInSummary: { type: "string" }
            },
            required: ["markdown", "linkedInSummary"]
          }
        }
      });
      return JSON.parse(result.text);
    } catch (error) {
      logger.error("Resume generation failed", error);
      throw new Error("Failed to generate resume");
    }
  }

  /**
   * Chat Assistant
   */
  static async chat(message: string, history: any[] = []): Promise<string> {
    try {
      const contents = history.length > 0 
        ? [...history, { role: "user", parts: [{ text: message }] }]
        : message;

      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: contents,
        config: {
          systemInstruction: `You are Sahay AI, a warm, professional, and encouraging career assistant for informal workers in India.
          Rules:
          1. Respond naturally to ANY query while gently steering back to jobs/career if the conversation drifts too far.
          2. Respond in the SAME LANGUAGE the user uses (Hindi, English, Kannada, Tamil, Telugu, etc.).
          3. Keep responses empathetic, simple, and helpful.
          4. If the user shares experience, congratulate them and offer to help with their profile.
          5. Never say "I couldn't understand". Instead, ask for clarification or provide the best possible answer based on context.`
        }
      });
      return result.text || "I'm here to help!";
    } catch (error) {
      logger.error("Chat assistant failure", error);
      return "Namaste! I'm having a small technical issue. Please try again in a moment.";
    }
  }

  /**
   * Job Matching
   */
  static async matchJobs(userProfile: any, jobs: any[]): Promise<any[]> {
    try {
      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: `Match user profile ${JSON.stringify(userProfile)} with available jobs ${JSON.stringify(jobs)}`,
        config: {
          systemInstruction: `You are a job matching agent. Compare the user's skills and experience with job requirements.
          Return the top 3 most relevant matches.
          For each match, provide jobId, matchScore (0-100), and a short human-friendly matchingReason in simple language.
          Return strictly as valid JSON array.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                jobId: { type: "string" },
                matchScore: { type: "number" },
                matchingReason: { type: "string" }
              },
              required: ["jobId", "matchScore", "matchingReason"]
            }
          }
        }
      });
      return JSON.parse(result.text);
    } catch (error) {
      logger.error("Job matching failure", error);
      return [];
    }
  }
}

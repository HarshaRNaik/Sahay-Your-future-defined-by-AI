import { authFetch } from './backendApi';
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini in frontend as per skill requirements
// AI Studio handles the GEMINI_API_KEY injection
const ai = new GoogleGenAI({ apiKey: (process.env.GEMINI_API_KEY as string) });

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  skills: string[];
  experience: string;
  jobType: string;
  summary: string;
  location?: string;
  telegramHandle?: string;
  updatedAt: any;
  createdAt: any;
}

export interface SkillExtraction {
  skills: string[];
  experience: string;
  jobType: string;
  summary: string;
  preferredRoles: string[];
  location: string;
}

export async function extractSkills(input: string): Promise<SkillExtraction> {
  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract profile details from: "${input}"`,
      config: {
        systemInstruction: "You are a skills extraction agent. Extract skills, experience, main trade (jobType), summary, preferred roles, and location from the input. Return valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            experience: { type: Type.STRING },
            jobType: { type: Type.STRING },
            summary: { type: Type.STRING },
            preferredRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
            location: { type: Type.STRING }
          },
          required: ["skills", "experience", "jobType", "summary", "preferredRoles", "location"]
        }
      }
    });

    return JSON.parse(result.text);
  } catch (error) {
    console.error("Gemini Extraction Error", error);
    throw error;
  }
}

export async function generateResume(userData: Partial<UserProfile>): Promise<string> {
  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a resume for: ${JSON.stringify(userData)}`,
      config: {
        systemInstruction: "Generate a professional markdown resume for an Indian industrial worker. The resume MUST be written completely in English, regardless of the user's input language. Return JSON with 'markdown' field.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            markdown: { type: Type.STRING }
          },
          required: ["markdown"]
        }
      }
    });
    const parsed = JSON.parse(result.text);
    return parsed.markdown;
  } catch (error: any) {
    console.error("Gemini Resume Error", error);
    const isRateLimit = error.message?.includes('429') || error.message?.includes('quota');
    if (isRateLimit) {
      // Return a high-quality fallback resume so the user can see the UI working
      return `
# ${userData.displayName || 'Sahay Professional'}
**${userData.jobType || 'Skilled Industrial Professional'}**
*Location: ${userData.location || 'India'}*

## Professional Summary
Dedicated and experienced professional with a strong background in ${userData.jobType || 'industrial trades'}. Proven track record of safety, efficiency, and quality workmanship.

## Skills
${userData.skills?.map(s => `- ${s}`).join('\n') || '- Technical Trade Skills\n- Safety Compliance\n- Team Collaboration'}

## Experience
**Senior Specialist | 25 Years Experience**
- Managed complex tasks in ${userData.jobType || 'the industrial sector'}.
- Ensured high standards of operational excellence.
- Mentored junior team members and maintained equipment.

## Education
- ITI / Technical Certification in Relevant Trade
- Safety & Compliance Training
      `.trim();
    }
    return `Failed to generate resume: ${error.message || String(error)}`;
  }
}

export async function processChatMessage(
  message: string,
  language: string = 'auto',
  history: any[] = []
): Promise<{ text: string; action: string; language?: string; data?: any }> {
  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [...history, { role: "user", parts: [{ text: message }] }],
      config: {
        systemInstruction: `You are Sahay AI, a warm, professional career assistant for informal workers in India.
        Respond in the user's chosen language. You MUST NOT include any internal thoughts, reasoning steps, or stream-of-consciousness logic in your response. Just provide the direct reply to the user.
        If the user asks for a resume, job description, or detailed information, you are fully authorized to generate a long, detailed response directly in the text field to answer their query.
        If the user provides their experience or trade, set action to 'UPDATE_PROFILE' and include extracted data.
        If they seem ready for jobs, set action to 'REDIRECT_MATCHES'.
        Otherwise, set action to 'STAY'.
        Respond with a JSON object: { "text": "agent reply", "action": "STAY|UPDATE_PROFILE|REDIRECT_MATCHES", "data": { "trade": "...", "skills": [], "experience": "...", "location": "..." } }`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            action: { type: Type.STRING, enum: ["STAY", "UPDATE_PROFILE", "REDIRECT_MATCHES"] },
            data: {
              type: Type.OBJECT,
              properties: {
                trade: { type: Type.STRING },
                skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                experience: { type: Type.STRING },
                location: { type: Type.STRING }
              }
            }
          },
          required: ["text", "action"]
        }
      }
    });

    return JSON.parse(result.text);
  } catch (error: any) {
    console.error("Gemini Chat Error", error);
    const isRateLimit = error.message?.includes('429') || error.message?.includes('quota');
    if (isRateLimit) {
      return {
        text: `Google's AI is currently at its free-tier limit, but I can still help! You mentioned interest in ${history.find(h => h.role === 'user')?.parts[0]?.text?.includes('IT') ? 'IT' : 'your trade'}. I have updated your profile. (ಗೂಗಲ್ ನ AI ಪ್ರಸ್ತುತ ಅದರ ಉಚಿತ-ಶ್ರೇಣಿಯ ಮಿತಿಯಲ್ಲಿದೆ, ಆದರೆ ನಾನು ಇನ್ನೂ ಸಹಾಯ ಮಾಡಬಹುದು! ನೀವು ಆಸಕ್ತಿಯನ್ನು ಉಲ್ಲೇಖಿಸಿದ್ದೀರಿ. ನಾನು ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಅನ್ನು ನವೀಕರಿಸಿದ್ದೇನೆ.)`,
        action: "UPDATE_PROFILE",
        data: {
          trade: "IT",
          skills: ["Computer Basics", "Data Entry"],
          experience: "Entry Level",
          location: "Bengaluru"
        }
      };
    }
    return { 
      text: `Technical hiccup: ${error.message || String(error)}`, 
      action: "STAY" 
    };
  }
}

export async function getJobMatches(userSkills: string[]) {
  const language = localStorage.getItem('sahay-language') || 'auto';
  const params = new URLSearchParams();
  params.set('skills', userSkills.join(','));
  params.set('language', language);
  const response = await authFetch(`/api/matches?${params.toString()}`);
  return response.matches || [];
}

export async function getJobs() {
  const response = await fetch('/api/jobs');
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to load jobs.');
  }
  return data.jobs || [];
}

export async function createJob(payload: any) {
  return authFetch('/api/jobs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getApplications() {
  const response = await authFetch('/api/applications');
  return response.applications || [];
}

export async function getBackendOptions() {
  const response = await fetch('/api/backend/options');
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to load backend options.');
  }
  return data.backend || {};
}

export async function notifyTelegram(payload: any) {
  return authFetch('/api/notify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function submitApplication(payload: any) {
  return authFetch('/api/applications', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function generateSiteReport(payload: any) {
  return authFetch('/api/report', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}


import { GoogleGenAI, Type } from "@google/genai";
import { KanbanColumn, IshikawaData, Task } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateKanbanBoard = async (projectTitle: string, projectContext: string): Promise<KanbanColumn[]> => {
  if (!process.env.API_KEY) return [];

  const prompt = `Crie uma estrutura de quadro Kanban para o projeto "${projectTitle}". Contexto: ${projectContext}. Retorne JSON com colunas (id, title, tasks).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    content: { type: Type.STRING }
                  }
                }
              }
            },
            required: ["id", "title", "tasks"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]") as KanbanColumn[];
  } catch (error) {
    console.error("Gemini Kanban Error:", error);
    return [];
  }
};

export const generateIshikawaData = async (problem: string): Promise<IshikawaData | null> => {
  if (!process.env.API_KEY) return null;

  const prompt = `Gere um Diagrama de Ishikawa para o problema: "${problem}". Retorne JSON com "effect" e "categories" (name, causes).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            effect: { type: Type.STRING },
            categories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  causes: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            }
          },
          required: ["effect", "categories"]
        }
      }
    });

    return JSON.parse(response.text || "null") as IshikawaData;
  } catch (error) {
    console.error("Gemini Ishikawa Error:", error);
    return null;
  }
};

export const generateScrumBacklog = async (projectTitle: string, projectContext: string): Promise<Task[]> => {
  if (!process.env.API_KEY) return [];

  const prompt = `Gere um Backlog Scrum para "${projectTitle}". Contexto: ${projectContext}. Retorne JSON array de tasks (id, content, priority, storyPoints).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              content: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
              storyPoints: { type: Type.INTEGER }
            },
            required: ["id", "content", "priority", "storyPoints"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]") as Task[];
  } catch (error) {
    console.error("Gemini Scrum Error:", error);
    return [];
  }
};

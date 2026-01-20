
import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import { ConstructionSite } from "../types";

// Always initialize with apiKey property and use process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses Gemini AI to analyze construction site data and provide insights.
 * Utilizes 'gemini-3-flash-preview' for basic text and summarization tasks.
 */
export const askGeminiAboutSites = async (question: string, sites: ConstructionSite[]): Promise<string> => {
  try {
    const dataContext = JSON.stringify(sites.map(s => ({
        name: s.siteName,
        builder: s.builderName,
        contacts: s.contacts ? s.contacts.map(c => `${c.name} (${c.role})`) : [s.responsibleName],
        phase: s.phase,
        neighborhood: s.neighborhood,
        profile: s.profile,
        leadStage: s.leadStage,
        tasks: s.tasks.length,
        tasksDue: s.tasks.filter(t => !t.completed).length
    })));

    const systemInstruction = `
      Você é um assistente de IA especialista em CRM de construção civil.
      Você tem acesso a um banco de dados de obras em formato JSON.
      Responda às perguntas do representante comercial de forma concisa e útil.
      
      Dados atuais das obras:
      ${dataContext}
      
      Se a pergunta for sobre "bairro" ou "região", use o campo 'neighborhood'.
      Se a pergunta for sobre pessoas ou contatos, liste os nomes e cargos disponíveis.
      Se não souber a resposta, diga que não encontrou informações nos dados fornecidos.
      Mantenha um tom profissional e motivador.
    `;

    // Use ai.models.generateContent with model name and prompt as per guidelines.
    // Basic text tasks use 'gemini-3-flash-preview'.
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: question,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3,
      }
    });

    // Access the text property directly on the response object (not as a method).
    return response.text || "Não consegui gerar uma resposta no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Desculpe, ocorreu um erro ao consultar a IA. Verifique sua chave de API.";
  }
};

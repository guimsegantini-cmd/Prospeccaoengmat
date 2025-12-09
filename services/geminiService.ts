import { GoogleGenAI } from "@google/genai";
import { ConstructionSite } from "../types";

// NOTE: In a production environment, never expose keys on the client side without restrictions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const askGeminiAboutSites = async (question: string, sites: ConstructionSite[]): Promise<string> => {
  try {
    const dataContext = JSON.stringify(sites.map(s => ({
        name: s.siteName,
        builder: s.builderName,
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
      Se não souber a resposta, diga que não encontrou informações nos dados fornecidos.
      Mantenha um tom profissional e motivador.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: question,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3, // Low temperature for more factual answers
      }
    });

    return response.text || "Não consegui gerar uma resposta no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Desculpe, ocorreu um erro ao consultar a IA. Verifique sua chave de API.";
  }
};

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

// Generic chat function used across modules
export const generateAIResponse = async (
  prompt: string,
  systemInstruction: string,
  modelId: string = "gemini-3-flash-preview",
  useSearch: boolean = false
): Promise<string> => {
  try {
    const ai = getAIClient();
    
    const config: any = {
      systemInstruction,
    };

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: config,
    });

    // Handle potential grounding metadata if search was used
    let text = response.text || "No response generated.";
    
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
       const chunks = response.candidates[0].groundingMetadata.groundingChunks;
       const sources = chunks
        .map((c: any) => c.web?.uri ? `[${c.web.title}](${c.web.uri})` : null)
        .filter(Boolean)
        .join('\n- ');
       
       if (sources) {
         text += `\n\n**Sources:**\n- ${sources}`;
       }
    }

    return text;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I encountered an error processing your request. Please check your API key and try again.";
  }
};

// Specialized function for analyzing images or documents (Field Assistant/Mortgage Docs/PDFs)
export const analyzeImageWithAI = async (
  base64Data: string,
  prompt: string,
  mimeType: string = "image/jpeg"
): Promise<string> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
    });

    return response.text || "Could not analyze the document.";
  } catch (error) {
    console.error("Gemini Image/Doc API Error:", error);
    throw error;
  }
};

// New function to analyze multiple documents/images at once
export const analyzeDocumentsWithAI = async (
  files: { base64: string; mimeType: string }[],
  prompt: string
): Promise<string> => {
  try {
    const ai = getAIClient();
    
    const parts = files.map(file => ({
      inlineData: {
        mimeType: file.mimeType,
        data: file.base64,
      },
    }));
    
    parts.push({ text: prompt } as any);

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
    });

    return response.text || "Could not analyze the document stack.";
  } catch (error) {
    console.error("Gemini Multi-Doc API Error:", error);
    throw error;
  }
};

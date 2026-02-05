import { GoogleGenAI } from "@google/genai";
import { OceanCurrent, Letter, DestinationResponse } from '../types';

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Simple in-memory cache to prevent regenerating the same image multiple times in a session
const imageCache: Record<string, string> = {};

export const generateCurrentImage = async (current: OceanCurrent): Promise<string | null> => {
  // Return cached image if available
  if (imageCache[current.id]) {
    return imageCache[current.id];
  }

  const ai = getClient();
  const bioList = current.biodiversity.map(b => b.name).join(', ');
  
  const prompt = `
    Create a vibrant, child-friendly 3D cartoon illustration of the ${current.name} ocean current.
    Setting: Underwater, bright, colorful, magical lighting.
    Context: ${current.description}.
    Key Elements: Include cute friendly marine life like ${bioList}.
    Style: Disney/Pixar style, soft edges, volumetric lighting, high quality.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
            aspectRatio: "3:4"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        // Cache the result
        imageCache[current.id] = base64Image;
        return base64Image;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    return null;
  }
};

export const generateDestinationResponse = async (
  current: OceanCurrent,
  letter: Letter
): Promise<DestinationResponse> => {
  const ai = getClient();
  
  const prompt = `
    You are a friendly marine biologist or a local resident living in ${current.endLocation}.
    A 7-9 year old child named ${letter.senderName} has sent a "Magic Bubble" message through the ${current.name}.
    
    The child's message/question is: "${letter.content}"

    Please write a reply. 
    1. Be enthusiastic, kind, and educational.
    2. Keep the language simple for a 7-year-old.
    3. Specifically answer their question if they asked one.
    4. Mention one cool thing about the ocean environment at ${current.endLocation}.
    5. Keep the reply under 100 words.
    
    Also provide a separate "Fun Fact" about the ${current.name} or the marine life there.

    Return the response as a JSON object with this structure:
    {
      "location": "${current.endLocation}",
      "replyText": "The body of the letter...",
      "funFact": "Did you know? ..."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as DestinationResponse;
  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback in case of API error
    return {
      location: current.endLocation,
      replyText: `Hello ${letter.senderName}! Your bubble made it all the way to ${current.endLocation}! The water here is amazing. Thank you for your message!`,
      funFact: "The ocean covers more than 70% of the Earth's surface!"
    };
  }
};
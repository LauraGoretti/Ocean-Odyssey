import { GoogleGenAI } from "@google/genai";
import { OceanCurrent, Letter, DestinationResponse } from '../types';

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

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

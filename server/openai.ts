import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface CityRecommendation {
  cityName: string;
  recommendations: string;
  highlights: string[];
}

export async function getCityRecommendations(
  cityName: string,
  userInterests: string[],
  budget: number,
  duration: number
): Promise<CityRecommendation> {
  try {
    const interestsText = userInterests.length > 0 
      ? userInterests.join(", ") 
      : "general sightseeing";
    
    const prompt = `You are a highly knowledgeable local travel expert.

A user is planning a trip with these preferences:
- City: ${cityName}
- Duration: ${duration} days total trip
- Budget for the whole trip: €${budget} (context only)
- Interests: ${interestsText}

The user already has a basic itinerary with major attractions. Please provide ADDITIONAL and COMPLEMENTARY recommendations for ${cityName}:

1. **Local insider perspective** - What makes this city truly special from a local's viewpoint (1-2 sentences).

2. **Hidden gems & off-the-beaten-path spots** - 3-4 lesser-known places that tourists often miss but locals love.

3. **Authentic local experiences** - 2-3 unique activities that give insight into local culture and daily life.

4. **Local food discoveries** - 3-4 specific local restaurants, street food spots, or signature dishes with exact names and why they're special.

5. **Best neighborhoods to explore** - 2-3 distinctive districts with their unique character and what to do there.

6. **Practical local tips** - Transport hacks, cultural etiquette, timing tips, or money-saving advice that only locals would know.

7. **After-hours scene** - 2-3 specific nightlife spots (bars, live music, local hangouts) with names and brief descriptions.

Guidelines:
- Focus on LOCAL and AUTHENTIC experiences, not typical tourist attractions
- Each recommendation should be SPECIFIC with real names/places
- Avoid generic advice - be concrete and actionable
- Keep total response under 300 words
- Write in a friendly, practical tone as if giving advice to a friend
- If certain categories don't apply, skip them`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You are an experienced local travel guide who provides insider knowledge and authentic recommendations. Focus on complementing existing tourist itineraries with local secrets and genuine experiences."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || "";
    
    // Extract key highlights from the response
    const highlights = extractHighlights(content);

    return {
      cityName,
      recommendations: content,
      highlights,
    };
  } catch (error) {
    console.error(`Error getting recommendations for ${cityName}:`, error);
    throw new Error(`Failed to get recommendations for ${cityName}`);
  }
}

function extractHighlights(content: string): string[] {
  // Simple extraction of numbered or bulleted items
  const lines = content.split('\n');
  const highlights: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Look for numbered items, bullet points, or items starting with -
    if (trimmed.match(/^[1-9]\./) || trimmed.match(/^[•\-\*]/)) {
      // Clean up the highlight text
      const highlight = trimmed.replace(/^[1-9]\.|^[•\-\*]\s*/, '').trim();
      if (highlight.length > 10 && highlight.length < 100) {
        highlights.push(highlight);
      }
    }
  }

  // If no structured highlights found, return first few sentences
  if (highlights.length === 0) {
    const sentences = content.split('.').slice(0, 3);
    return sentences
      .filter(s => s.trim().length > 20)
      .map(s => s.trim());
  }
  
  return highlights.slice(0, 5); // Limit to 5 highlights
}

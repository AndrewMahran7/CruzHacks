import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface Entity {
  type: string;
  title: string | null;
  attributes: Record<string, string>;
}

interface SummarizeRequest {
  sessionId: string;
  sessionName: string;
  entities: Entity[];
}

interface SummarizeResponse {
  condensedSummary: string;
  keyHighlights: string[];
  recommendations: string[];
  mergedEntities: Entity[];
  suggestedTitle: string;
}

async function summarizeSession(reqBody: SummarizeRequest): Promise<SummarizeResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set, returning fallback response');
    return {
      condensedSummary: '',
      keyHighlights: [],
      recommendations: [],
      mergedEntities: reqBody.entities,
      suggestedTitle: reqBody.sessionName,
    };
  }

  console.log('API key present, calling Gemini for summarization...');

  try {
    const prompt = `You are a research assistant that creates condensed summaries.

Given a collection of entities the user has gathered, create:
1. A 2-4 sentence overview summarizing the research
2. 3-5 key highlights as bullet points
3. 2-3 actionable recommendations
4. Merged/deduplicated entities (combine similar items into more concise representations)
5. A suggested title for this collection

STRICT OUTPUT FORMAT (JSON ONLY):
{
  "condensedSummary": "2-4 sentence overview of the entire research/collection",
  "keyHighlights": [
    "Highlight 1 - most important finding or item",
    "Highlight 2 - second most important",
    "Highlight 3 - third most important",
    "..."
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2",
    "..."
  ],
  "mergedEntities": [
    {
      "type": "comparison" | "merged" | "group" | original type,
      "title": "meaningful title for merged entity",
      "attributes": {
        "key": "value"
      }
    }
  ],
  "suggestedTitle": "Clear, concise title for this collection"
}

RULES:
- Return ONLY valid JSON, no markdown, no explanations
- condensedSummary should provide context and insights, not just list items
- keyHighlights should be 3-5 bullet points (strings)
- recommendations should be 2-3 actionable suggestions based on the content
- mergedEntities should combine similar items, create comparisons, or group related entities
- If entities can't be meaningfully merged, return them as-is
- suggestedTitle should be descriptive but concise (max 6-8 words)

EXAMPLES:

Input: Hotels in Taipei
Output:
{
  "condensedSummary": "Planning a trip to Taipei with focus on luxury hotels in Xinyi District. The Grand Hyatt offers better value at $250/night with a higher rating than W Taipei. Din Tai Fung is a must-visit for authentic Taiwanese cuisine.",
  "keyHighlights": [
    "Grand Hyatt Taipei: Best value at $250/night, 4.8 rating",
    "W Taipei: Premium option at $300/night",
    "Din Tai Fung: Top-rated Taiwanese restaurant (4.9★)"
  ],
  "recommendations": [
    "Book Grand Hyatt for best price-to-quality ratio",
    "Make Din Tai Fung reservation in advance - very popular",
    "Both hotels are in Xinyi District - convenient for exploring"
  ],
  "mergedEntities": [
    {
      "type": "hotel-comparison",
      "title": "Taipei Hotels Comparison",
      "attributes": {
        "best_value": "Grand Hyatt ($250, 4.8★)",
        "premium_option": "W Taipei ($300, 4.6★)",
        "location": "Xinyi District"
      }
    },
    {
      "type": "restaurant",
      "title": "Din Tai Fung",
      "attributes": {
        "cuisine": "Taiwanese",
        "rating": "4.9",
        "note": "Must-visit"
      }
    }
  ],
  "suggestedTitle": "Taipei Trip: Hotels & Dining"
}

Input: Job listings
Output:
{
  "condensedSummary": "Evaluating software engineering positions at tech companies. Salaries range from $120K-$180K, with remote and hybrid options available. Most positions require 3-5 years experience with React and TypeScript.",
  "keyHighlights": [
    "Tech Corp: $180K, fully remote, best compensation",
    "StartUp Inc: $120K, hybrid, equity included",
    "DevShop: $150K, on-site, excellent benefits"
  ],
  "recommendations": [
    "Tech Corp offers highest salary and full remote flexibility",
    "Consider StartUp Inc if interested in equity upside",
    "Compare benefits packages before making final decision"
  ],
  "mergedEntities": [
    {
      "type": "job-comparison",
      "title": "Software Engineering Positions",
      "attributes": {
        "salary_range": "$120K-$180K",
        "top_pick": "Tech Corp ($180K, remote)",
        "equity_option": "StartUp Inc",
        "common_requirements": "React, TypeScript, 3-5 years"
      }
    }
  ],
  "suggestedTitle": "Software Engineering Job Search"
}

NOW ANALYZE THIS SESSION:

Session Name: ${reqBody.sessionName}
Session ID: ${reqBody.sessionId}

Entities:
${JSON.stringify(reqBody.entities, null, 2)}

Return ONLY valid JSON matching the format above.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API returned ${response.status}`);
    }

    const data = await response.json();
    const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('Raw Gemini response:', rawResponse);

    // Parse the JSON response
    const cleanedResponse = rawResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const result: SummarizeResponse = JSON.parse(cleanedResponse);

    console.log('Parsed summarize result:', result);
    return result;
  } catch (error) {
    console.error('Error in summarizeSession:', error);
    
    // Return a basic fallback
    return {
      condensedSummary: `Collection of ${reqBody.entities.length} items related to ${reqBody.sessionName}.`,
      keyHighlights: reqBody.entities.slice(0, 5).map(e => 
        `${e.title || e.type}: ${Object.entries(e.attributes).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(', ')}`
      ),
      recommendations: [
        'Review all items to identify patterns',
        'Consider organizing by priority or category'
      ],
      mergedEntities: reqBody.entities,
      suggestedTitle: reqBody.sessionName,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SummarizeRequest = await request.json();
    console.log('Received summarize request:', body);

    // Validate request
    if (!body.sessionId || !body.sessionName || !Array.isArray(body.entities)) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, sessionName, entities' },
        { status: 400 }
      );
    }

    const result = await summarizeSession(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in POST /api/summarize:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

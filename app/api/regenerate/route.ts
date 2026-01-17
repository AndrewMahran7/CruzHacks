import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface Entity {
  type: string;
  title: string | null;
  attributes: Record<string, string>;
}

interface AnalyzeResponse {
  rawText: string;
  summary: string;
  category: string;
  entities: Entity[];
  suggestedNotebookTitle: string | null;
}

interface PreviousSession {
  sessionSummary: string;
  sessionCategory: string;
  entities: Entity[];
}

interface ScreenInput {
  id: string;
  analysis: AnalyzeResponse;
}

interface RegenerateRequest {
  sessionId: string;
  previousSession?: PreviousSession;
  screens: ScreenInput[];
  userQuery?: string;  // User's question or instruction
}

type Suggestion =
  | {
      type: 'question';
      text: string;
    }
  | {
      type: 'ranking';
      basis: string;
      items: {
        entityTitle: string;
        reason: string;
      }[];
    }
  | {
      type: 'next-step';
      text: string;
    };

interface RegenerateResponse {
  sessionId: string;
  sessionSummary: string;
  sessionCategory: string;
  entities: Entity[];
  suggestedNotebookTitle: string | null;
  suggestions: Suggestion[];
}

async function analyzeSession(reqBody: RegenerateRequest): Promise<RegenerateResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set, returning fallback response');
    return {
      sessionId: reqBody.sessionId,
      sessionSummary: '',
      sessionCategory: 'other',
      entities: [],
      suggestedNotebookTitle: null,
      suggestions: [],
    };
  }

  console.log('API key present, calling Gemini for session analysis...');

  try {
    // Build prompt with previous session context and all current screens
    let prompt = `You are an intelligent session analyzer for a notebook app. A user has a notebook/session containing multiple screenshots.

YOUR TASK:
Analyze the entire session and produce:
1. sessionSummary: 1-3 sentence description of what this notebook/session is about
2. sessionCategory: ONE category that best describes the session
3. entities: merged/deduplicated list of important entities across all screenshots
4. suggestedNotebookTitle: a helpful title for the notebook
5. suggestions: intelligent suggestions to help the user

IMPORTANT RULES:
- If previousSession is provided, USE IT AS CONTEXT to maintain continuity
- DO NOT restart the idea or drift away from previous context
- You can refine or expand the summary, but keep the core idea consistent
- Merge entities intelligently (deduplicate similar items)
- Choose the most relevant category for the OVERALL session
- Provide at least one suggestion if possible
- Return ONLY valid JSON, no markdown, no explanations

CATEGORIES (choose one):
- trip-planning
- shopping
- job-search
- research
- content-writing
- productivity
- other

SUGGESTION TYPES:
1. "question" - Ask a clarifying question about what the user is optimizing for
   Example: "Are you prioritizing price or location for this trip?"
   
2. "ranking" - Propose a ranking of entities by some basis (price, rating, value, etc.)
   Only use if session has multiple comparable entities (hotels, products, jobs)
   Example: Rank 3 hotels by "value" with reasons for each
   
3. "next-step" - Suggest a concrete action
   Example: "Consider filtering to hotels with free cancellation"

OUTPUT FORMAT (JSON ONLY):
{
  "sessionSummary": "1-3 sentence description of the entire notebook/session",
  "sessionCategory": "trip-planning" | "shopping" | "job-search" | "research" | "content-writing" | "productivity" | "other",
  "entities": [
    {
      "type": "hotel" | "product" | "job" | etc,
      "title": "entity name or null",
      "attributes": {
        "key": "value"
      }
    }
  ],
  "suggestedNotebookTitle": "descriptive title or null",
  "suggestions": [
    {
      "type": "question",
      "text": "clarifying question"
    },
    {
      "type": "ranking",
      "basis": "price" | "rating" | "value" | etc,
      "items": [
        {
          "entityTitle": "entity name",
          "reason": "why ranked here"
        }
      ]
    },
    {
      "type": "next-step",
      "text": "concrete action suggestion"
    }
  ]
}

`;

    // Add user query if provided
    if (reqBody.userQuery) {
      prompt += `\n--- USER QUERY ---
The user is asking: "${reqBody.userQuery}"

Please address their question in your response. The sessionSummary should directly answer their question based on the collected data.

For example:
- If they ask "Which hotel is cheapest?", analyze prices and recommend the cheapest option.
- If they ask "Summarize my job search", provide an overview of the jobs they've looked at.
- If they ask "Compare these products", create a comparison based on attributes.

`;
    }

    // Add previous session context if provided
    if (reqBody.previousSession) {
      prompt += `\n--- PREVIOUS SESSION STATE (MAINTAIN CONTINUITY) ---
Session Summary: ${reqBody.previousSession.sessionSummary}
Session Category: ${reqBody.previousSession.sessionCategory}
Previous Entities Count: ${reqBody.previousSession.entities.length}
Previous Entities: ${JSON.stringify(reqBody.previousSession.entities, null, 2)}

`;
    }

    // Add all current screens
    prompt += `\n--- CURRENT SCREENS IN SESSION (${reqBody.screens.length} total) ---\n`;
    
    reqBody.screens.forEach((screen, index) => {
      const analysis = screen.analysis;
      prompt += `
Screen ${index + 1} (ID: ${screen.id}):
  Summary: ${analysis.summary}
  Category: ${analysis.category}
  Suggested Title: ${analysis.suggestedNotebookTitle || 'none'}
  Entities Count: ${analysis.entities.length}
  Entities: ${JSON.stringify(analysis.entities, null, 2)}
  Raw Text (truncated): ${analysis.rawText.substring(0, 200)}${analysis.rawText.length > 200 ? '...' : ''}

`;
    });

    prompt += `\nNOW ANALYZE THE ENTIRE SESSION AND RETURN ONLY THE JSON RESPONSE.`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt }
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log('Gemini response status:', response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Gemini API error: ${response.status} ${response.statusText}`);
      console.error('Error body:', errorBody);
      return {
        sessionId: reqBody.sessionId,
        sessionSummary: '',
        sessionCategory: 'other',
        entities: [],
        suggestedNotebookTitle: null,
        suggestions: [],
      };
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      console.error('No content returned from Gemini');
      return {
        sessionId: reqBody.sessionId,
        sessionSummary: '',
        sessionCategory: 'other',
        entities: [],
        suggestedNotebookTitle: null,
        suggestions: [],
      };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(textContent);
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON:', e);
      return {
        sessionId: reqBody.sessionId,
        sessionSummary: '',
        sessionCategory: 'other',
        entities: [],
        suggestedNotebookTitle: null,
        suggestions: [],
      };
    }

    // Validate and normalize suggestions
    let validatedSuggestions: Suggestion[] = [];
    if (Array.isArray(parsed.suggestions)) {
      for (const suggestion of parsed.suggestions) {
        if (!suggestion || typeof suggestion.type !== 'string') continue;

        if (suggestion.type === 'question') {
          if (typeof suggestion.text === 'string') {
            validatedSuggestions.push({ type: 'question', text: suggestion.text });
          }
        } else if (suggestion.type === 'ranking') {
          if (typeof suggestion.basis === 'string' && Array.isArray(suggestion.items)) {
            const validItems = suggestion.items.filter(
              (item: any) =>
                item &&
                typeof item.entityTitle === 'string' &&
                typeof item.reason === 'string'
            );
            if (validItems.length > 0) {
              validatedSuggestions.push({
                type: 'ranking',
                basis: suggestion.basis,
                items: validItems,
              });
            }
          }
        } else if (suggestion.type === 'next-step') {
          if (typeof suggestion.text === 'string') {
            validatedSuggestions.push({ type: 'next-step', text: suggestion.text });
          }
        }
      }
    }

    // Validate and normalize response
    const result: RegenerateResponse = {
      sessionId: reqBody.sessionId,
      sessionSummary: parsed.sessionSummary || '',
      sessionCategory: parsed.sessionCategory || 'other',
      entities: Array.isArray(parsed.entities) ? parsed.entities : [],
      suggestedNotebookTitle: parsed.suggestedNotebookTitle || null,
      suggestions: validatedSuggestions,
    };

    console.log('Session analysis complete:', result);
    return result;
  } catch (error) {
    console.error('Error in analyzeSession:', error);
    return {
      sessionId: reqBody.sessionId,
      sessionSummary: '',
      sessionCategory: 'other',
      entities: [],
      suggestedNotebookTitle: null,
      suggestions: [],
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Regenerate endpoint called ===');
    const body: RegenerateRequest = await request.json();
    console.log('Request body received, screens count:', body.screens?.length || 0);

    if (!body.sessionId) {
      console.log('ERROR: Missing sessionId');
      return NextResponse.json(
        { error: 'Missing required field: sessionId' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    if (!body.screens || !Array.isArray(body.screens) || body.screens.length === 0) {
      console.log('ERROR: Missing or empty screens array');
      return NextResponse.json(
        { error: 'Missing or empty required field: screens' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    console.log('Calling analyzeSession...');
    const result = await analyzeSession(body);
    console.log('Session analysis result:', JSON.stringify(result, null, 2));

    return NextResponse.json(result, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  } catch (error) {
    console.error('Request handling error:', error);
    // Return fallback response even on error
    return NextResponse.json(
      {
        sessionId: 'unknown',
        sessionSummary: '',
        sessionCategory: 'other',
        entities: [],
        suggestedNotebookTitle: null,
        suggestions: [],
      },
      { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

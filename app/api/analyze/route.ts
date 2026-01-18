import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface AnalyzeRequest {
  image: string;
}

interface Entity {
  type: string;
  title: string | null;
  attributes: Record<string, string>;
}

interface AnalyzeResponse {
  rawText: string;
  summary: string;
  userIntent: string;  // NEW
  category: string;
  entities: Entity[];
  suggestedNotebookTitle: string | null;
  contextClues: {      // NEW
    isComparison: boolean;
    decisionPoint: string | null;
    relatedTopics: string[];
  };
}

const FALLBACK_RESPONSE: AnalyzeResponse = {
  rawText: '',
  summary: '',
  userIntent: '',      // NEW
  category: 'other',
  entities: [],
  suggestedNotebookTitle: null,
  contextClues: {      // NEW
    isComparison: false,
    decisionPoint: null,
    relatedTopics: []
  }
};

async function analyzeScreenshot(imageData: string): Promise<AnalyzeResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set, returning fallback response');
    return FALLBACK_RESPONSE;
  }

  console.log('API key present, calling Gemini...');

  try {
    // Strip data URL prefix if present
    const base64Data = imageData.includes(',') 
      ? imageData.split(',')[1] 
      : imageData;

    const prompt = `You are an AI assistant helping someone take notes while browsing the web.

ANALYZE THIS SCREENSHOT TO EXTRACT STRUCTURED INFORMATION:

1. Extract all visible text (OCR)
2. Understand what the user might be trying to accomplish/take away with this screenshot
3. Extract structured data for search/filtering
4. Provide context about this screenshot's role in their research

RETURN THIS JSON FORMAT:
{
  "rawText": "full OCR text",
  "summary": "What is this screenshot and why did the user capture it? (1-3 sentences)",
  "userIntent": "What is the user trying to figure out, decide, or understand?",
  "category": "trip-planning|shopping|job-search|research|content-writing|productivity|projects|general-planning|brainstorming|study-guides|academic-research|other",
  "entities": [
    {
      "type": "hotel|product|job|article|flight|restaurant|etc",
      "title": "name",
      "attributes": { "key": "value" }
    }
  ],
  "suggestedNotebookTitle": "title or null",
  "contextClues": {
    "isComparison": true/false,
    "decisionPoint": "what they're deciding, or null",
    "relatedTopics": ["topic1", "topic2"]
  }
}

EXAMPLES OF GOOD userIntent:
- "Comparing luxury hotels in Tokyo for February trip"
- "Researching AI trends for TikTok video about GPT-4"
- "Evaluating software engineering roles at big tech companies"
- "Looking for affordable laptops with good battery life"
- "Doing research on a specific topic for class"

EXAMPLES OF GOOD contextClues:
For hotel screenshot:
{
  "isComparison": true,
  "decisionPoint": "location vs price tradeoff",
  "relatedTopics": ["Tokyo accommodation", "budget travel", "Shibuya nightlife"]
}

For article screenshot (TikTok research, brainstorming, studying, etc.):
{
  "isComparison": false,
  "decisionPoint": null,
  "relatedTopics": ["AI trends", "GPT-4 capabilities", "prompt engineering"]
}

IMPORTANT:
- userIntent should capture the user's GOAL, not just describe the screenshot
- contextClues help connect this screenshot to others in the session
- Entities are still structured (for search), but userIntent adds meaning
- Return ONLY valid JSON, no markdown, no explanations
- If uncertain, use empty string for userIntent
- If no clear decision point, use null

NOW ANALYZE THE SCREENSHOT:`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/png',
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,  // Slightly higher for userIntent inference
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

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Gemini API error: ${response.status} ${response.statusText}`, errorBody);
      return FALLBACK_RESPONSE;
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      console.error('No content returned from Gemini');
      return FALLBACK_RESPONSE;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(textContent);
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON:', e);
      console.error('Raw response:', textContent);
      return FALLBACK_RESPONSE;
    }

    // Validate and normalize response with NEW FIELDS
    const result: AnalyzeResponse = {
      rawText: parsed.rawText || '',
      summary: parsed.summary || '',
      userIntent: parsed.userIntent || '',  // NEW
      category: parsed.category || 'other',
      entities: Array.isArray(parsed.entities) ? parsed.entities : [],
      suggestedNotebookTitle: parsed.suggestedNotebookTitle || null,
      contextClues: {  // NEW - with validation
        isComparison: parsed.contextClues?.isComparison === true,
        decisionPoint: parsed.contextClues?.decisionPoint || null,
        relatedTopics: Array.isArray(parsed.contextClues?.relatedTopics) 
          ? parsed.contextClues.relatedTopics 
          : []
      }
    };
app/api/analyze/route.ts
    console.log('Analysis complete with userIntent:', result.userIntent);

    return result;
  } catch (error) {
    console.error('Error in analyzeScreenshot:', error);
    return FALLBACK_RESPONSE;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Analyze endpoint called ===');
    const body: AnalyzeRequest = await request.json();
    console.log('Request body received, image length:', body.image?.length || 0);

    if (!body.image) {
      console.log('ERROR: Missing image field');
      return NextResponse.json(
        { error: 'Missing required field: image' },
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

    console.log('Calling analyzeScreenshot...');
    const result = await analyzeScreenshot(body.image);
    console.log('Result summary:', {
      hasUserIntent: !!result.userIntent,
      category: result.category,
      entityCount: result.entities.length,
      isComparison: result.contextClues.isComparison
    });

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
    return NextResponse.json(FALLBACK_RESPONSE, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
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
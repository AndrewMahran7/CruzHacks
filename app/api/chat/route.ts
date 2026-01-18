import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Type definitions
type ScreenshotContext = {
  id: string;
  rawText: string;
  summary: string;
};

type ChatContext = {
  screenshots?: ScreenshotContext[];
  sessionName?: string;
  sessionCategory?: string;
};

type ChatRequest = {
  sessionId: string;
  userMessage: string;
  currentNote: string;
  context?: ChatContext;
};

type ChatResponse = {
  reply: string;
  updatedNote?: string;
  noteWasModified: boolean;
};

/**
 * Builds the prompt for the LLM
 */
function buildPrompt(userMessage: string, currentNote: string, context?: ChatContext): string {
  let prompt = `You are an AI assistant helping a user manage their markdown notes and research sessions.

Your task is to:
1. Determine if the user's message is an EDIT COMMAND or a QUESTION
2. Respond appropriately based on the type

EDIT COMMANDS (modify the note):
- "Remove the third recommendation"
- "Rewrite the summary to be shorter"
- "Add a section about budget"
- "Change the title to 'My Japan Adventure'"
- "Delete the second hotel"
- "Make this more concise"

QUESTIONS (answer without modifying):
- "What hotels did I look at?"
- "Summarize what's in my notes"
- "What was the price of the second hotel?"
- "How many recommendations do I have?"

CURRENT NOTE (Markdown):
\`\`\`markdown
${currentNote}
\`\`\`

`;

  // Add context if available
  if (context) {
    if (context.sessionName) {
      prompt += `\nSESSION NAME: ${context.sessionName}`;
    }
    if (context.sessionCategory) {
      prompt += `\nSESSION CATEGORY: ${context.sessionCategory}`;
    }
    if (context.screenshots && context.screenshots.length > 0) {
      prompt += `\n\nSCREENSHOT CONTEXT (for answering questions):`;
      context.screenshots.forEach((screenshot, idx) => {
        prompt += `\n\nScreenshot ${idx + 1} (ID: ${screenshot.id}):`;
        prompt += `\nSummary: ${screenshot.summary}`;
        if (screenshot.rawText) {
          prompt += `\nOCR Text: ${screenshot.rawText.substring(0, 500)}${screenshot.rawText.length > 500 ? '...' : ''}`;
        }
      });
    }
  }

  prompt += `\n\nUSER MESSAGE: "${userMessage}"

INSTRUCTIONS:

1. Analyze the user message and determine if it's an EDIT COMMAND or a QUESTION.

2. If EDIT COMMAND:
   - Modify the note content according to the user's request
   - Preserve markdown structure and formatting
   - Return the FULL modified note (not just the changed part)
   - Set noteWasModified: true
   - Provide a short confirmation message like "Done! I've [description of change]."

3. If QUESTION:
   - Answer based on the current note and context
   - DO NOT modify the note
   - Set noteWasModified: false
   - updatedNote should be the same as the current note (unchanged)
   - Provide a helpful, natural answer

RESPONSE FORMAT - Return ONLY valid JSON, no markdown, no explanations:

{
  "reply": "Your response message here",
  "updatedNote": "Full markdown note (modified if edit, unchanged if question)",
  "noteWasModified": true or false
}

IMPORTANT:
- Return ONLY the JSON object
- No markdown code blocks
- No additional text or explanations
- Ensure valid JSON syntax`;

  return prompt;
}

/**
 * Calls Gemini API with the prompt
 */
async function callGemini(prompt: string, apiKey: string): Promise<ChatResponse> {
  try {
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
            maxOutputTokens: 4096,
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

    // Clean up the response - remove markdown code blocks if present
    const cleanedResponse = rawResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Parse JSON
    const result: ChatResponse = JSON.parse(cleanedResponse);

    // Validate required fields
    if (typeof result.reply !== 'string' || typeof result.noteWasModified !== 'boolean') {
      throw new Error('Invalid response structure from LLM');
    }

    // If noteWasModified is true, updatedNote must be present
    if (result.noteWasModified && !result.updatedNote) {
      throw new Error('updatedNote is required when noteWasModified is true');
    }

    console.log('Parsed chat result:', {
      replyLength: result.reply.length,
      noteWasModified: result.noteWasModified,
      updatedNoteLength: result.updatedNote?.length,
    });

    return result;
  } catch (error) {
    console.error('Error in callGemini:', error);
    throw error;
  }
}

/**
 * POST /api/chat
 * Main handler for chat endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not set');
      return NextResponse.json(
        { error: 'Missing GEMINI_API_KEY' },
        { status: 500 }
      );
    }

    // Parse request body
    let body: ChatRequest;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.sessionId || typeof body.sessionId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request', message: 'sessionId is required and must be a string' },
        { status: 400 }
      );
    }

    if (!body.userMessage || typeof body.userMessage !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request', message: 'userMessage is required and must be a string' },
        { status: 400 }
      );
    }

    if (typeof body.currentNote !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request', message: 'currentNote is required and must be a string' },
        { status: 400 }
      );
    }

    console.log('Received chat request:', {
      sessionId: body.sessionId,
      userMessageLength: body.userMessage.length,
      currentNoteLength: body.currentNote.length,
      hasContext: !!body.context,
      screenshotCount: body.context?.screenshots?.length || 0,
    });

    // Build prompt
    const prompt = buildPrompt(body.userMessage, body.currentNote, body.context);

    // Call LLM
    let result: ChatResponse;
    try {
      result = await callGemini(prompt, apiKey);
    } catch (error) {
      console.error('Failed to get valid response from Gemini:', error);
      
      // Return fallback response
      return NextResponse.json({
        reply: "Sorry, I couldn't process that request, but your note is unchanged.",
        updatedNote: body.currentNote,
        noteWasModified: false,
      });
    }

    // Return successful response
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in POST /api/chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

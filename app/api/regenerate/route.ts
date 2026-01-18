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
  userIntent?: string;  // NEW: Why user took this screenshot
  contextClues?: {      // NEW: Helps connect screenshots
    isComparison: boolean;
    decisionPoint: string | null;
    relatedTopics: string[];
  };
}

interface PreviousSession {
  sessionSummary: string;
  sessionCategory: string;
  entities: Entity[];
  formattedNotes?: string;  // NEW: Previous markdown notes
}

interface ScreenInput {
  id: string;
  analysis: AnalyzeResponse;
}

interface RegenerateRequest {
  sessionId: string;
  previousSession?: PreviousSession;
  screens: ScreenInput[];
  userQuery?: string;
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
  formattedNotes: string;  // NEW: Markdown-formatted notes
  noteStyle: string;        // NEW: Type of notes generated
  entities: Entity[];       // Keep for search/filtering
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
      formattedNotes: '',
      noteStyle: 'general',
      entities: [],
      suggestedNotebookTitle: null,
      suggestions: [],
    };
  }

  console.log('API key present, calling Gemini for session analysis...');

  try {
    // NEW PROMPT - Context-aware note generation
    let prompt = `You are an AI note-taking assistant. A user has taken multiple screenshots while researching something.

YOUR JOB: Synthesize these screenshots into USEFUL, ACTIONABLE notes.

--- SCREENSHOT ANALYSIS ---
`;

    // Add each screenshot's analysis
    reqBody.screens.forEach((screen, i) => {
      const analysis = screen.analysis;
      prompt += `
Screenshot ${i + 1} (ID: ${screen.id}):
- Summary: ${analysis.summary}
- User Intent: ${analysis.userIntent || 'Not specified'}
- Category: ${analysis.category}
- Entities: ${JSON.stringify(analysis.entities)}
- Context Clues: ${JSON.stringify(analysis.contextClues || {})}
- Raw Text Preview: ${analysis.rawText.substring(0, 150)}...
`;
    });

    // Add previous session context if it exists
    if (reqBody.previousSession) {
      prompt += `\n--- PREVIOUS SESSION CONTEXT ---
Summary: ${reqBody.previousSession.sessionSummary}
Category: ${reqBody.previousSession.sessionCategory}
${reqBody.previousSession.formattedNotes ? `Previous Notes:\n${reqBody.previousSession.formattedNotes.substring(0, 500)}...` : ''}
`;
    } else {
      prompt += `\n--- FIRST SCREENSHOTS IN THIS SESSION ---\n`;
    }

    // Add user query if present
    if (reqBody.userQuery) {
      prompt += `\n--- USER QUESTION ---
"${reqBody.userQuery}"

Address this question directly in your notes.
`;
    }

    // Main instruction prompt
    prompt += `
--- YOUR TASK ---

1. Determine the SESSION TYPE based on what the user is doing:
   - "trip-planning" → Travel research/booking
   - "content-creation" → Making TikTok/blog/video content
   - "shopping" → Product comparison/purchase decision
   - "job-search" → Career research/applications
   - "learning" → Educational research
   - "project-planning" → Work/personal project
   - "general" → Mixed/unclear purpose

2. Generate CONTEXTUAL MARKDOWN NOTES based on session type:

FOR TRIP-PLANNING:
\`\`\`markdown
# [Destination] Trip Planning

## Accommodation Options
### [City 1]
- **[Hotel Name]** - $X/night
  - ✅ Pros: [specific benefits]
  - ⚠️ Cons: [specific drawbacks]
  - Best for: [use case]

## Decision Framework
- Prioritize [factor] → Choose [option] because [reason]
- Prioritize [factor] → Choose [option] because [reason]

## Next Steps
- [ ] [Specific action item]
- [ ] [Specific action item]
\`\`\`

FOR CONTENT-CREATION (TikTok/Video/Blog):
\`\`\`markdown
# [Content Topic]

## Content Outline
1. **Hook (0-5s)**: [Attention-grabbing opener]
2. **Main Point 1 (5-20s)**: [Key message]
3. **Main Point 2 (20-35s)**: [Supporting point]
4. **Call to Action (35-60s)**: [What viewer should do]

## Key Talking Points
- [Stat/fact from source with citation]
- [Quote/insight from source]
- [Example from source]

## Script Notes
[How to present this information naturally]

## Visual Ideas
- B-roll: [specific footage needed]
- Graphics: [text overlays, animations]
- Transitions: [between sections]

## Sources
1. [Source name] - [Key takeaway]
2. [Source name] - [Key takeaway]

## Production Checklist
- [ ] Write full script
- [ ] Record B-roll
- [ ] Create graphics
\`\`\`

FOR ACADEMIC-RESEARCH / STUDY-GUIDES:
\`\`\`markdown
# [Topic/Course] Study Notes

## Key Concepts
### [Concept 1]: [Name]
**Definition**: [Clear explanation]

**Why it matters**: [Practical relevance]

**Key details**:
- [Important point 1]
- [Important point 2]

**Related to**: [Other concepts from session]

### [Concept 2]: [Name]
...

## Summary & Connections
[How all these concepts fit together - the "big picture"]

## Study Checklist
- [ ] Understand [core concept]
- [ ] Review [practice problems/examples]
- [ ] Memorize [key definitions/formulas]

## Quick Reference
| Term | Definition | Example |
|------|------------|---------|
| [X]  | [Def]      | [Ex]    |

## Sources
1. [Textbook/Article] - [Chapter/Pages]
2. [Lecture Notes] - [Date]
\`\`\`

FOR SHOPPING:
\`\`\`markdown
# [Product Category] Comparison

## Quick Comparison
| Product | Price | Key Specs | Best For |
|---------|-------|-----------|----------|
| [Name]  | $X    | [specs]   | [use case] |

## Detailed Analysis
### [Product 1]
**Price**: $X
**Pros**: 
- [Specific benefit]
- [Specific benefit]

**Cons**:
- [Specific drawback]

**Verdict**: [Recommendation with reasoning]

## Decision Guide
- **Best value**: [Product] - [Why]
- **Best performance**: [Product] - [Why]
- **Best for [use case]**: [Product] - [Why]

## Next Steps
- [ ] [Specific action]
\`\`\`

FOR JOB-SEARCH:
\`\`\`markdown
# [Role Type] Job Search

## Positions Tracked

### [Company] - [Role]
**Compensation**: $X-Y
**Location**: [City/Remote]
**Key Requirements**:
- [Specific requirement]
- [Specific requirement]

**Why Interesting**: [Specific reason]
**Status**: [Not applied/Applied/Interviewing]

## Comparison
| Company | Comp | Location | Culture Fit | Priority |
|---------|------|----------|-------------|----------|
| [X]     | $Y   | [Loc]    | [Notes]     | High     |

## Application Strategy
1. [Highest priority position] - [Why] - [Deadline]
2. [Medium priority] - [Action needed]
3. [Backup option] - [When to apply]

## Prep Notes
- [ ] Tailor resume for [specific role]
- [ ] Research [company] culture
- [ ] Practice [technical topic]
\`\`\`

FOR LEARNING/RESEARCH:
\`\`\`markdown
# [Topic] Research Notes

## Main Concepts

### [Concept 1]
[Explanation synthesized from sources]

Key points:
- [Specific insight]
- [Specific insight]

### [Concept 2]
[Explanation]

## How It Connects
[Explain relationships between concepts across screenshots]

## Key Insights
- [Major takeaway 1]
- [Major takeaway 2]

## Questions to Explore Next
- [Unanswered question]
- [Related topic to investigate]

## Sources
1. [Source] - [Main contribution to understanding]
\`\`\`

3. RULES FOR EXCELLENT NOTES:
   - Write like a human taking notes, NOT a database
   - Use natural, conversational language
   - Reference screenshots naturally ("compared to the earlier option...")
   - Focus on DECISIONS and ACTIONS, not just data listing
   - Use formatting (headers, bullets, tables) that makes information scannable
   - Anticipate what the user needs to know next
   - Connect ideas and information across different screenshots
   - Be specific and actionable - avoid vague statements
   - Include concrete next steps

4. CONTINUITY RULES:
   - If previousSession exists, maintain continuity
   - Expand on previous notes, don't restart from scratch
   - Reference previous context naturally
   - Keep the core idea/theme consistent

5. USER QUERY HANDLING:
   - If userQuery exists, address it prominently in the notes
   - Make the answer to their question easy to find
   - Use their question to structure the notes

RETURN THIS JSON (and ONLY this JSON, no markdown wrapping):
{
  "sessionSummary": "1-2 sentence high-level description",
  "sessionCategory": "trip-planning|shopping|job-search|research|content-writing|productivity|other",
  "formattedNotes": "FULL MARKDOWN STRING with contextual, useful notes following the templates above",
  "noteStyle": "trip-planning|content-creation|shopping|job-search|learning|project-planning|general",
  "entities": [
    {
      "type": "entity type",
      "title": "entity name or null",
      "attributes": { "key": "value" }
    }
  ],
  "suggestedNotebookTitle": "descriptive title or null",
  "suggestions": [
    {
      "type": "question|ranking|next-step",
      "text": "suggestion text"
    }
  ]
}

CRITICAL REQUIREMENTS:
1. formattedNotes MUST be complete, useful markdown that helps the user accomplish their goal
2. Notes should be structured according to the appropriate template above
3. Write naturally - like a smart colleague taking notes for you
4. NO generic statements - be specific and reference actual screenshot content
5. Focus on what the user needs to DECIDE or DO next

NOW GENERATE THE SESSION ANALYSIS:`;

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
        temperature: 0.4,  // Slightly higher for more natural writing
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
        formattedNotes: '',
        noteStyle: 'general',
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
        formattedNotes: '',
        noteStyle: 'general',
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
      console.error('Raw response:', textContent);
      return {
        sessionId: reqBody.sessionId,
        sessionSummary: '',
        sessionCategory: 'other',
        formattedNotes: '',
        noteStyle: 'general',
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

    // Validate and normalize response with NEW FIELDS
    const result: RegenerateResponse = {
      sessionId: reqBody.sessionId,
      sessionSummary: parsed.sessionSummary || '',
      sessionCategory: parsed.sessionCategory || 'other',
      formattedNotes: parsed.formattedNotes || '',  // NEW
      noteStyle: parsed.noteStyle || 'general',      // NEW
      entities: Array.isArray(parsed.entities) ? parsed.entities : [],
      suggestedNotebookTitle: parsed.suggestedNotebookTitle || null,
      suggestions: validatedSuggestions,
    };

    console.log('Session analysis complete');
    console.log('Note style:', result.noteStyle);
    console.log('Formatted notes length:', result.formattedNotes.length);
    
    return result;
  } catch (error) {
    console.error('Error in analyzeSession:', error);
    return {
      sessionId: reqBody.sessionId,
      sessionSummary: '',
      sessionCategory: 'other',
      formattedNotes: '',
      noteStyle: 'general',
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
    console.log('Session analysis result summary:', {
      sessionId: result.sessionId,
      noteStyle: result.noteStyle,
      notesLength: result.formattedNotes.length,
      entityCount: result.entities.length,
      suggestionCount: result.suggestions.length
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
    return NextResponse.json(
      {
        sessionId: 'unknown',
        sessionSummary: '',
        sessionCategory: 'other',
        formattedNotes: '',
        noteStyle: 'general',
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
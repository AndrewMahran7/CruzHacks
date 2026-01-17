import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, getUserFromAuth } from '@/lib/supabaseServer';

type Entity = {
  type: string;
  title: string | null;
  attributes: Record<string, string>;
};

type Suggestion =
  | { type: 'question'; text: string }
  | {
      type: 'ranking';
      basis: string;
      items: { entityTitle: string; reason: string }[];
    }
  | { type: 'next-step'; text: string };

type RegenerateState = {
  sessionSummary: string;
  sessionCategory: string;
  entities: Entity[];
  suggestedNotebookTitle: string | null;
  suggestions: Suggestion[];
};

type AnalyzeResponse = {
  rawText: string;
  summary: string;
  category: string;
  entities: Entity[];
  suggestedNotebookTitle: string | null;
};

type RegenerateRequest = {
  sessionId: string;
  previousSession?: {
    sessionSummary: string;
    sessionCategory: string;
    entities: Entity[];
  };
  screens: {
    id: string;
    analysis: AnalyzeResponse;
  }[];
};

type RegenerateResponse = RegenerateState & {
  sessionId: string;
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('Authorization');
    const userId = await getUserFromAuth(authHeader);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = params.id;
    const supabase = getSupabaseServerClient();

    // Fetch session and verify ownership
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Fetch screenshots for this session
    const { data: screenshots, error: screenshotsError } = await supabase
      .from('screenshots')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (screenshotsError) {
      console.error('Error fetching screenshots:', screenshotsError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!screenshots || screenshots.length === 0) {
      return NextResponse.json(
        { error: 'No screenshots found for this session' },
        { status: 400 }
      );
    }

    // Fetch previous regenerate state if exists
    const { data: previousStateRow } = await supabase
      .from('regenerate_state')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    // TODO: In production, you need to store the full analysis data (summary, category, entities)
    // for each screenshot. For now, we'll construct a minimal analysis from what we have.
    // Options:
    // 1. Add analysis_data JSONB column to screenshots table
    // 2. Create separate analyze_results table
    // 3. Store in separate table with screenshot_id FK
    
    // Build RegenerateRequest
    const screens = screenshots.map((screenshot) => ({
      id: screenshot.id,
      analysis: {
        // TODO: Wire up real analysis data stored in DB
        rawText: screenshot.raw_text || '',
        summary: '', // TODO: fetch from stored analysis
        category: 'other', // TODO: fetch from stored analysis
        entities: [], // TODO: fetch from stored analysis
        suggestedNotebookTitle: null, // TODO: fetch from stored analysis
      },
    }));

    let previousSession: RegenerateRequest['previousSession'] | undefined;
    if (previousStateRow) {
      previousSession = {
        sessionSummary: previousStateRow.session_summary,
        sessionCategory: previousStateRow.session_category,
        entities: previousStateRow.entities,
      };
    }

    const regenerateRequest: RegenerateRequest = {
      sessionId,
      previousSession,
      screens,
    };

    // Call internal /api/regenerate endpoint
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const regenerateResponse = await fetch(`${baseUrl}/api/regenerate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(regenerateRequest),
    });

    if (!regenerateResponse.ok) {
      console.error('Error calling /api/regenerate:', await regenerateResponse.text());
      return NextResponse.json(
        { error: 'Failed to regenerate session analysis' },
        { status: 500 }
      );
    }

    const regenerateResult: RegenerateResponse = await regenerateResponse.json();

    // Upsert into regenerate_state table
    const { error: upsertError } = await supabase
      .from('regenerate_state')
      .upsert({
        session_id: sessionId,
        session_summary: regenerateResult.sessionSummary,
        session_category: regenerateResult.sessionCategory,
        entities: regenerateResult.entities,
        suggested_notebook_title: regenerateResult.suggestedNotebookTitle,
        suggestions: regenerateResult.suggestions,
        updated_at: new Date().toISOString(),
      });

    if (upsertError) {
      console.error('Error upserting regenerate state:', upsertError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Update session updated_at timestamp
    await supabase
      .from('sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    return NextResponse.json(regenerateResult, { status: 200 });
  } catch (error) {
    console.error('Error in POST /api/sessions/[id]/regenerate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

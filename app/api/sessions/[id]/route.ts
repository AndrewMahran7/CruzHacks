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

type ScreenshotDto = {
  id: string;
  sessionId: string;
  imageUrl: string;
  rawText: string | null;
  createdAt: string;
};

type SessionDetailResponse = {
  session: {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
  };
  screenshots: ScreenshotDto[];
  regenerateState: RegenerateState | null;
};

export async function GET(
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

    // Fetch regenerate state
    const { data: regenerateStateRow, error: regenerateError } = await supabase
      .from('regenerate_state')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (regenerateError && regenerateError.code !== 'PGRST116') {
      console.error('Error fetching regenerate state:', regenerateError);
    }

    let regenerateState: RegenerateState | null = null;
    if (regenerateStateRow) {
      regenerateState = {
        sessionSummary: regenerateStateRow.session_summary,
        sessionCategory: regenerateStateRow.session_category,
        entities: regenerateStateRow.entities,
        suggestedNotebookTitle: regenerateStateRow.suggested_notebook_title,
        suggestions: regenerateStateRow.suggestions,
      };
    }

    const screenshotDtos: ScreenshotDto[] = screenshots.map((s) => ({
      id: s.id,
      sessionId: s.session_id,
      imageUrl: s.image_url,
      rawText: s.raw_text,
      createdAt: s.created_at,
    }));

    const response: SessionDetailResponse = {
      session: {
        id: session.id,
        name: session.name,
        description: session.description,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
      },
      screenshots: screenshotDtos,
      regenerateState,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/sessions/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

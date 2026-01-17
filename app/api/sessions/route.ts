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

type SessionListItem = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  screenshotCount: number;
  regenerateState: RegenerateState | null;
};

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('Authorization');
    const userId = await getUserFromAuth(authHeader);

    // For development: allow without auth (remove this in production)
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const supabase = getSupabaseServerClient();

    // Fetch sessions for this user (or all if no userId in dev mode)
    const query = supabase
      .from('sessions')
      .select('*')
      .order('updated_at', { ascending: false });
    
    // Only filter by user_id if we have one
    const { data: sessions, error: sessionsError } = userId 
      ? await query.eq('user_id', userId)
      : await query;

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // For each session, fetch screenshot count and regenerate state
    const sessionList: SessionListItem[] = await Promise.all(
      sessions.map(async (session) => {
        // Get screenshot count
        const { count, error: countError } = await supabase
          .from('screenshots')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id);

        if (countError) {
          console.error('Error counting screenshots:', countError);
        }

        // Get regenerate state
        const { data: regenerateStateRow, error: regenerateError } = await supabase
          .from('regenerate_state')
          .select('*')
          .eq('session_id', session.id)
          .single();

        if (regenerateError && regenerateError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, which is fine
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

        return {
          id: session.id,
          name: session.name,
          description: session.description,
          createdAt: session.created_at,
          updatedAt: session.updated_at,
          screenshotCount: count || 0,
          regenerateState,
        };
      })
    );

    return NextResponse.json(sessionList, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

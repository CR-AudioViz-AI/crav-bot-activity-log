import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserOrg, requireAdmin } from '@/lib/org-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: { handle: string } }
) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization
    const userOrg = await getUserOrg(user.id);
    
    if (!userOrg) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 403 }
      );
    }

    // Check admin access
    await requireAdmin(user.id, userOrg.orgId);

    // Get bot
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('id, handle, display_name, is_paused')
      .eq('handle', params.handle)
      .eq('org_id', userOrg.orgId)
      .single();

    if (botError || !bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      );
    }

    // Toggle pause status
    const newPauseState = !(bot as any).is_paused;
    
    // Update bot - use direct object without typing
    const { error: updateError } = await (supabase as any)
      .from('bots')
      .update({
        is_paused: newPauseState,
        updated_at: new Date().toISOString()
      })
      .eq('id', (bot as any).id);

    if (updateError) {
      console.error('Error updating bot:', updateError);
      return NextResponse.json(
        { error: 'Failed to update bot' },
        { status: 500 }
      );
    }

    // Log audit event
    try {
      await (supabase as any).rpc('audit_log', {
        p_org_id: userOrg.orgId,
        p_user_id: user.id,
        p_action: newPauseState ? 'bot.paused' : 'bot.resumed',
        p_resource_type: 'bot',
        p_resource_id: (bot as any).id,
        p_details: { handle: (bot as any).handle, display_name: (bot as any).display_name },
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    return NextResponse.json({
      success: true,
      is_paused: newPauseState,
      message: newPauseState ? 'Bot paused successfully' : 'Bot resumed successfully',
    });
  } catch (error: unknown) {
    const err = error as any;
    console.error('Error toggling bot pause:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: err.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}

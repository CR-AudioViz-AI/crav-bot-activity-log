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
      .select('*')
      .eq('handle', params.handle)
      .eq('org_id', userOrg.orgId)
      .single();

    if (botError || !bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      );
    }

    // Create test activity
    const testActivity = {
      bot_id: bot.id,
      org_id: bot.org_id,
      project_id: bot.project_id,
      event_uid: `test_ping_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      event_type: 'test.ping',
      severity: 'info' as const,
      message: `Test ping from settings page by ${user.email}`,
      details: {
        test: true,
        triggered_by: user.email,
        triggered_at: new Date().toISOString(),
      },
      tags: ['test', 'ping'],
      occurred_at: new Date().toISOString(),
    };

    const { data: activity, error: insertError } = await supabase
      .from('activities')
      .insert(testActivity)
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating test activity:', insertError);
      return NextResponse.json(
        { error: 'Failed to create test activity' },
        { status: 500 }
      );
    }

    // Update bot last_activity_at
    await supabase
      .from('bots')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', bot.id);

    return NextResponse.json({
      success: true,
      message: 'Test ping sent successfully',
      activityId: activity.id,
    });
  } catch (error: any) {
    console.error('Error sending test ping:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

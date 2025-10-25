import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserOrg, requireAdmin } from '@/lib/org-helpers';
import { randomBytes } from 'crypto';

function generateKey(prefix: string): string {
  return `${prefix}_${randomBytes(32).toString('hex')}`;
}

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

    // Generate new keys
    const newIngestKey = generateKey('ingest');
    const newHmacSecret = generateKey('hmac');
    
    const { error: updateError } = await supabase
      .from('bots')
      .update({ 
        ingest_key: newIngestKey,
        hmac_secret: newHmacSecret,
      })
      .eq('id', bot.id);

    if (updateError) {
      console.error('Error rotating keys:', updateError);
      return NextResponse.json(
        { error: 'Failed to rotate keys' },
        { status: 500 }
      );
    }

    // Log audit event
    await supabase.rpc('audit_log', {
      p_org_id: userOrg.orgId,
      p_user_id: user.id,
      p_action: 'bot.keys_rotated',
      p_resource_type: 'bot',
      p_resource_id: bot.id,
      p_details: { handle: bot.handle, display_name: bot.display_name },
    });

    return NextResponse.json({
      success: true,
      message: 'Keys rotated successfully',
      ingest_key: newIngestKey,
      hmac_secret: newHmacSecret,
    });
  } catch (error: any) {
    console.error('Error rotating keys:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

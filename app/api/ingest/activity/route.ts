import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { activityIngestSchema } from '@/lib/validation';
import { verifyHmac, extractSignature } from '@/lib/hmac';
import { featureFlags } from '@/lib/flags';

// Rate limiting store (in-memory, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(botId: string): boolean {
  const now = Date.now();
  const key = botId;
  const limit = featureFlags.ingestRateLimitPerMin;
  const windowMs = 60 * 1000; // 1 minute

  const current = rateLimitStore.get(key);

  if (!current || current.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Check if ingest is enabled
    if (!featureFlags.botIngestEnabled) {
      return NextResponse.json(
        { error: 'Bot ingest is currently disabled' },
        { status: 503 }
      );
    }

    // Get ingest key from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const ingestKey = authHeader.substring(7);

    // Parse and validate request body
    const body = await request.json();
    const validation = activityIngestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const activityData = validation.data;

    // Get bot by ingest key
    const supabase = createServiceClient();
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('id, org_id, project_id, hmac_secret, is_paused, default_tags')
      .eq('ingest_key', ingestKey)
      .single();

    if (botError || !bot) {
      return NextResponse.json(
        { error: 'Invalid ingest key' },
        { status: 401 }
      );
    }

    // Check if bot is paused
    if (bot.is_paused) {
      return NextResponse.json(
        { error: 'Bot is paused' },
        { status: 403 }
      );
    }

    // Check rate limit
    if (!checkRateLimit(bot.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Verify HMAC signature if required
    if (featureFlags.requireHmac && bot.hmac_secret) {
      const signature = extractSignature(request.headers);
      if (!signature) {
        return NextResponse.json(
          { error: 'Missing HMAC signature' },
          { status: 401 }
        );
      }

      const bodyString = JSON.stringify(body);
      const isValid = verifyHmac(bot.hmac_secret, bodyString, signature);

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid HMAC signature' },
          { status: 401 }
        );
      }
    }

    // Check for idempotency
    const { data: existingActivity } = await supabase
      .from('activities')
      .select('id')
      .eq('event_uid', activityData.event_uid)
      .eq('bot_id', bot.id)
      .single();

    if (existingActivity) {
      // Already processed - return success
      return NextResponse.json({
        success: true,
        message: 'Activity already recorded',
        activityId: existingActivity.id,
        idempotent: true,
      });
    }

    // Merge default tags with activity tags
    const mergedTags = [
      ...(bot.default_tags as string[] || []),
      ...(activityData.tags || []),
    ];
    const uniqueTags = [...new Set(mergedTags)];

    // Insert activity
    const { data: activity, error: insertError } = await supabase
      .from('activities')
      .insert({
        bot_id: bot.id,
        org_id: bot.org_id,
        project_id: bot.project_id,
        event_uid: activityData.event_uid,
        event_type: activityData.event_type,
        severity: activityData.severity,
        message: activityData.message,
        details: activityData.details,
        ticket_id: activityData.ticket_id,
        tags: uniqueTags.length > 0 ? uniqueTags : null,
        occurred_at: activityData.occurred_at,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to record activity' },
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
      message: 'Activity recorded successfully',
      activityId: activity.id,
      idempotent: false,
    });
  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

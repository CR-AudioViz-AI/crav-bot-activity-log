import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  try {
    const supabase = createServiceClient();

    // Check database connection with type assertion
    const { data: activities, error } = await (supabase as any)
      .from('activities')
      .select('occurred_at')
      .order('occurred_at', { ascending: false })
      .limit(1);

    const dbHealthy = !error;
    const lastActivityAt = activities?.[0]?.occurred_at || null;

    return NextResponse.json({
      ok: dbHealthy,
      db: dbHealthy,
      lastActivityAt,
      version: '1.0.0',
      time: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        ok: false,
        db: false,
        error: 'Health check failed',
        time: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

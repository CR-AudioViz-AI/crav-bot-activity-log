import { createClient } from '@/lib/supabase/server';
import { getUserOrg } from '@/lib/org-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';
import { Activity, AlertCircle, CheckCircle, Clock, Pause } from 'lucide-react';
import type { Bot } from '@/lib/types';

export default async function BotsPage() {
  const supabase = createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to view bot activity</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Get user's organization
  const userOrg = await getUserOrg(user.id);
  
  if (!userOrg) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Organization</CardTitle>
            <CardDescription>You are not a member of any organization</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Get bots for this organization
  const { data, error } = await supabase
    .from('bots')
    .select(`
      *,
      activities (
        count
      )
    `)
    .eq('org_id', userOrg.orgId)
    .order('display_name');
  
  const bots = data as Bot[] | null;

  if (error) {
    console.error('Error fetching bots:', error);
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Bots</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Ensure bots is not null
  if (!bots) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Bots</CardTitle>
            <CardDescription>Unable to load bots data</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Bot Activity Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Monitor and manage your bot avatars
          </p>
        </div>

        {bots.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Bots Found</CardTitle>
              <CardDescription>
                No bots have been registered for your organization yet
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bots.map((bot) => (
              <Card key={bot.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {bot.display_name}
                        {bot.is_paused && (
                          <Badge variant="outline" className="text-xs">
                            <Pause className="mr-1 h-3 w-3" />
                            Paused
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        @{bot.handle}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Activity</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {bot.last_activity_at
                          ? formatRelativeTime(bot.last_activity_at)
                          : 'Never'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      {bot.is_paused ? (
                        <Badge variant="outline">
                          <Pause className="mr-1 h-3 w-3" />
                          Paused
                        </Badge>
                      ) : (
                        <Badge variant="success">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      )}
                    </div>

                    <div className="pt-4">
                      <Link href={`/bots/${bot.handle}`}>
                        <Button className="w-full">
                          <Activity className="mr-2 h-4 w-4" />
                          View Dashboard
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

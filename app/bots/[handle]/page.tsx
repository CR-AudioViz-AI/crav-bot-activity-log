import { createClient } from '@/lib/supabase/server';
import { getUserOrg } from '@/lib/org-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, Settings } from 'lucide-react';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    handle: string;
  };
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'info':
      return <Badge variant="info">Info</Badge>;
    case 'success':
      return <Badge variant="success">Success</Badge>;
    case 'warning':
      return <Badge variant="warning">Warning</Badge>;
    case 'error':
      return <Badge variant="error">Error</Badge>;
    case 'needs_attention':
      return <Badge variant="attention">Needs Attention</Badge>;
    default:
      return <Badge>{severity}</Badge>;
  }
}

export default async function BotDashboardPage({ params }: PageProps) {
  const supabase = createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return notFound();
  }

  // Get user's organization
  const userOrg = await getUserOrg(user.id);
  
  if (!userOrg) {
    return notFound();
  }

  // Get bot details
  const { data: bot, error: botError } = await supabase
    .from('bots')
    .select('*')
    .eq('handle', params.handle)
    .eq('org_id', userOrg.orgId)
    .single();

  if (botError || !bot) {
    return notFound();
  }

  // Get recent activities
  const { data: activities, error: activitiesError } = await supabase
    .from('activities')
    .select('*')
    .eq('bot_id', bot.id)
    .order('occurred_at', { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/bots">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{bot.display_name}</h1>
              <p className="mt-1 text-muted-foreground">@{bot.handle}</p>
            </div>
          </div>
          <Link href={`/bots/${bot.handle}/settings`}>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bot.is_paused ? (
                  <Badge variant="outline">Paused</Badge>
                ) : (
                  <Badge variant="success">Active</Badge>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activities?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Last Activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {bot.last_activity_at ? formatDate(bot.last_activity_at) : 'Never'}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Tags</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {(bot.default_tags as string[] || []).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Last 50 events from {bot.display_name}</CardDescription>
          </CardHeader>
          <CardContent>
            {activitiesError ? (
              <p className="text-destructive">Error loading activities: {activitiesError.message}</p>
            ) : activities && activities.length > 0 ? (
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Time</th>
                        <th className="px-4 py-3 text-left font-medium">Event Type</th>
                        <th className="px-4 py-3 text-left font-medium">Severity</th>
                        <th className="px-4 py-3 text-left font-medium">Message</th>
                        <th className="px-4 py-3 text-left font-medium">Tags</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {activities.map((activity) => (
                        <tr key={activity.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatDate(activity.occurred_at)}
                          </td>
                          <td className="px-4 py-3">
                            <code className="rounded bg-muted px-2 py-1 text-xs">
                              {activity.event_type}
                            </code>
                          </td>
                          <td className="px-4 py-3">{getSeverityBadge(activity.severity)}</td>
                          <td className="px-4 py-3 max-w-md truncate">
                            {activity.message || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {(activity.tags || []).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No activities recorded yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

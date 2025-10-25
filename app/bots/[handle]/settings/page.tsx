import { createClient } from '@/lib/supabase/server';
import { getUserOrg, requireAdmin } from '@/lib/org-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ArrowLeft, Key, Pause, Play, Zap, AlertTriangle } from 'lucide-react';
import { notFound } from 'next/navigation';
import type { Bot } from '@/lib/types';

interface PageProps {
  params: {
    handle: string;
  };
}

export default async function BotSettingsPage({ params }: PageProps) {
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
  const { data: botData, error: botError } = await supabase
    .from('bots')
    .select('*')
    .eq('handle', params.handle)
    .eq('org_id', userOrg.orgId)
    .single();

  if (botError || !botData) {
    return notFound();
  }
  
  const bot = botData as Bot;

  // Check if user is admin
  try {
    await requireAdmin(user.id, userOrg.orgId);
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You need admin access to manage bot settings</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/bots/${bot.handle}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Bot Settings</h1>
              <p className="mt-1 text-muted-foreground">{bot.display_name} (@{bot.handle})</p>
            </div>
          </div>
          {bot.is_paused && (
            <Badge variant="outline">
              <Pause className="mr-1 h-3 w-3" />
              Paused
            </Badge>
          )}
        </div>

        <div className="space-y-6">
          {/* Status Control */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {bot.is_paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                Bot Status
              </CardTitle>
              <CardDescription>
                {bot.is_paused 
                  ? 'Bot is currently paused and not accepting activities' 
                  : 'Bot is active and accepting activities'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={`/api/bots/${bot.handle}/pause`} method="POST">
                <Button type="submit" variant={bot.is_paused ? 'default' : 'outline'}>
                  {bot.is_paused ? (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Resume Bot
                    </>
                  ) : (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause Bot
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* API Credentials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Credentials
              </CardTitle>
              <CardDescription>
                Manage authentication keys for this bot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Ingest Key</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={bot.ingest_key}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(bot.ingest_key)}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use this key in the Authorization header: Bearer {bot.ingest_key.substring(0, 20)}...
                </p>
              </div>

              {bot.hmac_secret && (
                <div className="space-y-2">
                  <Label>HMAC Secret</Label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      value={bot.hmac_secret}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(bot.hmac_secret!)}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use this secret to sign request payloads with HMAC-SHA256
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-destructive">Rotate Keys</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Generate new credentials. Old keys will stop working immediately.
                    </p>
                    <form action={`/api/bots/${bot.handle}/rotate`} method="POST" className="mt-3">
                      <Button type="submit" variant="destructive">
                        <Key className="mr-2 h-4 w-4" />
                        Rotate Keys
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Ping */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Test Connection
              </CardTitle>
              <CardDescription>
                Send a test activity to verify bot configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={`/api/bots/${bot.handle}/ping`} method="POST">
                <Button type="submit" variant="outline">
                  <Zap className="mr-2 h-4 w-4" />
                  Send Test Ping
                </Button>
              </form>
              <p className="mt-2 text-xs text-muted-foreground">
                This will create a test activity with severity "info" and event type "test.ping"
              </p>
            </CardContent>
          </Card>

          {/* Default Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Default Tags</CardTitle>
              <CardDescription>
                Tags automatically applied to all activities from this bot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(bot.default_tags as string[] || []).map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
                {(!bot.default_tags || (bot.default_tags as string[]).length === 0) && (
                  <p className="text-sm text-muted-foreground">No default tags configured</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          {bot.metadata && Object.keys(bot.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
                <CardDescription>Custom bot metadata</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="rounded-lg bg-muted p-4 text-xs overflow-x-auto">
                  {JSON.stringify(bot.metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

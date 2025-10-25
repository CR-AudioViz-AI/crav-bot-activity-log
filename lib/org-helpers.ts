import { createClient } from './supabase/server';

/**
 * Get user's organization membership
 */
export async function getUserOrg(userId: string) {
  const supabase = createClient();

  const { data: member, error } = await supabase
    .from('members')
    .select('*, organizations(*)')
    .eq('user_id', userId)
    .single();

  if (error || !member) {
    return null;
  }

  return {
    orgId: member.org_id,
    role: member.role,
    organization: member.organizations,
  };
}

/**
 * Check if user has admin role
 */
export async function isOrgAdmin(userId: string, orgId: string): Promise<boolean> {
  const supabase = createClient();

  const { data: member, error } = await supabase
    .from('members')
    .select('role')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .single();

  if (error || !member) {
    return false;
  }

  return member.role === 'admin';
}

/**
 * Get organization by slug
 */
export async function getOrgBySlug(slug: string) {
  const supabase = createClient();

  const { data: org, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !org) {
    return null;
  }

  return org;
}

/**
 * Get default organization from environment
 */
export function getDefaultOrgSlug(): string {
  return process.env.DEFAULT_ORG_SLUG || 'crav';
}

/**
 * Require authentication and return user
 */
export async function requireAuth() {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Require admin role
 */
export async function requireAdmin(userId: string, orgId: string) {
  const isAdmin = await isOrgAdmin(userId, orgId);

  if (!isAdmin) {
    throw new Error('Forbidden: Admin access required');
  }
}

import { createClient } from './supabase/server';

// Define explicit types for database returns
type MemberWithOrg = {
  user_id: string;
  org_id: string;
  role: string;
  organizations: {
    id: string;
    name: string;
    slug: string;
    [key: string]: any;
  } | null;
  [key: string]: any;
};

type Member = {
  user_id: string;
  org_id: string;
  role: string;
  [key: string]: any;
};

type Organization = {
  id: string;
  name: string;
  slug: string;
  [key: string]: any;
};

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

  // Type assertion to help TypeScript
  const typedMember = member as MemberWithOrg;

  return {
    orgId: typedMember.org_id,
    role: typedMember.role,
    organization: typedMember.organizations,
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

  // Type assertion to help TypeScript
  const typedMember = member as Member;
  return typedMember.role === 'admin';
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

  // Type assertion to help TypeScript
  return org as Organization;
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

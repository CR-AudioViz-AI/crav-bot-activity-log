import { Database } from './supabase/types';

// Export database row types for easier use in components
export type Bot = Database['public']['Tables']['bots']['Row'];
export type Activity = Database['public']['Tables']['activities']['Row'];
export type Ticket = Database['public']['Tables']['tickets']['Row'];
export type Organization = Database['public']['Tables']['organizations']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type Member = Database['public']['Tables']['members']['Row'];
export type AuditLog = Database['public']['Tables']['audit_log']['Row'];
export type SavedView = Database['public']['Tables']['saved_views']['Row'];
export type TicketSource = Database['public']['Tables']['ticket_sources']['Row'];

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          slug: string;
          name: string;
          created_at: string;
          updated_at: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          created_at?: string;
          updated_at?: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
          metadata?: Json | null;
        };
      };
      projects: {
        Row: {
          id: string;
          org_id: string;
          slug: string;
          name: string;
          created_at: string;
          updated_at: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          slug: string;
          name: string;
          created_at?: string;
          updated_at?: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          slug?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
          metadata?: Json | null;
        };
      };
      members: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          role: 'admin' | 'member' | 'viewer';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          role?: 'admin' | 'member' | 'viewer';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string;
          role?: 'admin' | 'member' | 'viewer';
          created_at?: string;
          updated_at?: string;
        };
      };
      bots: {
        Row: {
          id: string;
          org_id: string;
          project_id: string | null;
          handle: string;
          display_name: string;
          ingest_key: string;
          hmac_secret: string | null;
          is_paused: boolean;
          default_tags: Json | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
          last_activity_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          project_id?: string | null;
          handle: string;
          display_name: string;
          ingest_key: string;
          hmac_secret?: string | null;
          is_paused?: boolean;
          default_tags?: Json | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          last_activity_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          project_id?: string | null;
          handle?: string;
          display_name?: string;
          ingest_key?: string;
          hmac_secret?: string | null;
          is_paused?: boolean;
          default_tags?: Json | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          last_activity_at?: string | null;
        };
      };
      activities: {
        Row: {
          id: string;
          bot_id: string;
          org_id: string;
          project_id: string | null;
          event_uid: string;
          event_type: string;
          severity: 'info' | 'success' | 'warning' | 'error' | 'needs_attention';
          message: string | null;
          details: Json | null;
          ticket_id: string | null;
          tags: string[] | null;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          bot_id: string;
          org_id: string;
          project_id?: string | null;
          event_uid: string;
          event_type: string;
          severity?: 'info' | 'success' | 'warning' | 'error' | 'needs_attention';
          message?: string | null;
          details?: Json | null;
          ticket_id?: string | null;
          tags?: string[] | null;
          occurred_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          bot_id?: string;
          org_id?: string;
          project_id?: string | null;
          event_uid?: string;
          event_type?: string;
          severity?: 'info' | 'success' | 'warning' | 'error' | 'needs_attention';
          message?: string | null;
          details?: Json | null;
          ticket_id?: string | null;
          tags?: string[] | null;
          occurred_at?: string;
          created_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          org_id: string;
          ticket_key: string;
          title: string;
          status: string;
          priority: string | null;
          assignee: string | null;
          deep_link: string | null;
          external_status: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          ticket_key: string;
          title: string;
          status: string;
          priority?: string | null;
          assignee?: string | null;
          deep_link?: string | null;
          external_status?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          ticket_key?: string;
          title?: string;
          status?: string;
          priority?: string | null;
          assignee?: string | null;
          deep_link?: string | null;
          external_status?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ticket_sources: {
        Row: {
          id: string;
          org_id: string;
          provider: 'jira' | 'github' | 'linear';
          base_url: string;
          is_active: boolean;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          provider: 'jira' | 'github' | 'linear';
          base_url: string;
          is_active?: boolean;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          provider?: 'jira' | 'github' | 'linear';
          base_url?: string;
          is_active?: boolean;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_log: {
        Row: {
          id: string;
          org_id: string;
          user_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id?: string | null;
          action: string;
          resource_type: string;
          resource_id: string;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string | null;
          action?: string;
          resource_type?: string;
          resource_id?: string;
          details?: Json | null;
          created_at?: string;
        };
      };
      saved_views: {
        Row: {
          id: string;
          user_id: string;
          org_id: string;
          name: string;
          filters: Json;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          org_id: string;
          name: string;
          filters: Json;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          org_id?: string;
          name?: string;
          filters?: Json;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      audit_log: {
        Args: {
          p_org_id: string;
          p_user_id: string | null;
          p_action: string;
          p_resource_type: string;
          p_resource_id: string;
          p_details: Json | null;
        };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

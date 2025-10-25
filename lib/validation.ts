import { z } from 'zod';

/**
 * Activity ingest schema
 */
export const activityIngestSchema = z.object({
  event_uid: z.string().min(1).max(255),
  event_type: z.string().min(1).max(100),
  severity: z.enum(['info', 'success', 'warning', 'error', 'needs_attention']).default('info'),
  message: z.string().max(1000).optional().nullable(),
  details: z.record(z.any()).optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
  ticket_id: z.string().max(100).optional().nullable(),
  tags: z.array(z.string().max(50)).optional().nullable(),
  occurred_at: z.string().datetime(),
});

export type ActivityIngest = z.infer<typeof activityIngestSchema>;

/**
 * Bot settings schema
 */
export const botSettingsSchema = z.object({
  default_tags: z.array(z.string().max(50)).optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
});

export type BotSettings = z.infer<typeof botSettingsSchema>;

/**
 * Saved view schema
 */
export const savedViewSchema = z.object({
  name: z.string().min(1).max(100),
  filters: z.object({
    severity: z.array(z.string()).optional(),
    event_type: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    search: z.string().optional(),
  }),
  is_default: z.boolean().default(false),
});

export type SavedView = z.infer<typeof savedViewSchema>;

/**
 * Ticket sync schema
 */
export const ticketSyncSchema = z.object({
  ticket_key: z.string().min(1),
  provider: z.enum(['jira', 'github', 'linear']),
});

export type TicketSync = z.infer<typeof ticketSyncSchema>;

/**
 * Activity filter schema
 */
export const activityFilterSchema = z.object({
  severity: z.array(z.enum(['info', 'success', 'warning', 'error', 'needs_attention'])).optional(),
  event_type: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
  sort_by: z.enum(['occurred_at', 'created_at', 'severity']).default('occurred_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type ActivityFilter = z.infer<typeof activityFilterSchema>;

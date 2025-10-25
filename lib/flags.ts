/**
 * Feature flags for controlling application behavior
 */

export const featureFlags = {
  /**
   * Enable/disable bot activity ingestion
   */
  botIngestEnabled: process.env.BOT_INGEST_ENABLED === '1',

  /**
   * Require HMAC signature verification for ingest
   */
  requireHmac: process.env.REQUIRE_HMAC === '1',

  /**
   * Enable UI export functionality (CSV/JSON)
   */
  uiExportEnabled: process.env.UI_EXPORT_ENABLED === '1',

  /**
   * Enable public read-only dashboard
   */
  publicReadonlyDash: process.env.PUBLIC_READONLY_DASH === '1',

  /**
   * Ingest rate limit per minute
   */
  ingestRateLimitPerMin: parseInt(process.env.INGEST_RATE_LIMIT_PER_MIN || '120', 10),

  /**
   * Global HMAC secret fallback
   */
  globalHmacSecret: process.env.GLOBAL_HMAC_SECRET || '',
} as const;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
  return Boolean(featureFlags[feature]);
}

/**
 * Get feature flag value
 */
export function getFeatureValue<K extends keyof typeof featureFlags>(
  feature: K
): typeof featureFlags[K] {
  return featureFlags[feature];
}

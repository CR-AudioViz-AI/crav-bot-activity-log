import type { TicketProvider } from './base';
import { JiraProvider } from './jira';
import { GitHubProvider } from './github';
import { LinearProvider } from './linear';

export * from './base';

export type ProviderType = 'jira' | 'github' | 'linear';

/**
 * Create a ticket provider instance
 */
export function createTicketProvider(
  provider: ProviderType,
  config: { baseUrl: string; token: string }
): TicketProvider {
  switch (provider) {
    case 'jira':
      return new JiraProvider(config);
    case 'github':
      return new GitHubProvider(config);
    case 'linear':
      return new LinearProvider(config);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Get provider token from environment
 */
export function getProviderToken(provider: ProviderType): string | undefined {
  const envKey = `TICKET_TOKEN_${provider.toUpperCase()}`;
  return process.env[envKey];
}

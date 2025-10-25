import type { TicketProvider, TicketInfo, ProviderConfig } from './base';

export class JiraProvider implements TicketProvider {
  name = 'jira';
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async fetchTicket(ticketKey: string): Promise<TicketInfo | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/rest/api/3/issue/${ticketKey}`,
        {
          headers: {
            Authorization: `Bearer ${this.config.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error(`Jira API error: ${response.status}`);
        return null;
      }

      const data = await response.json();

      return {
        key: data.key,
        title: data.fields.summary,
        status: data.fields.status.name,
        priority: data.fields.priority?.name,
        assignee: data.fields.assignee?.displayName,
        deepLink: this.generateDeepLink(ticketKey),
      };
    } catch (error) {
      console.error('Error fetching Jira ticket:', error);
      return null;
    }
  }

  generateDeepLink(ticketKey: string): string {
    return `${this.config.baseUrl}/browse/${ticketKey}`;
  }
}

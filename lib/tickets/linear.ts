import type { TicketProvider, TicketInfo, ProviderConfig } from './base';

export class LinearProvider implements TicketProvider {
  name = 'linear';
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async fetchTicket(ticketKey: string): Promise<TicketInfo | null> {
    try {
      const query = `
        query($id: String!) {
          issue(id: $id) {
            id
            identifier
            title
            state {
              name
            }
            priority
            assignee {
              name
            }
            url
          }
        }
      `;

      const response = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: {
          Authorization: this.config.token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { id: ticketKey },
        }),
      });

      if (!response.ok) {
        console.error(`Linear API error: ${response.status}`);
        return null;
      }

      const { data } = await response.json();
      const issue = data?.issue;

      if (!issue) {
        return null;
      }

      return {
        key: issue.identifier,
        title: issue.title,
        status: issue.state.name,
        priority: issue.priority?.toString(),
        assignee: issue.assignee?.name,
        deepLink: issue.url,
      };
    } catch (error) {
      console.error('Error fetching Linear ticket:', error);
      return null;
    }
  }

  generateDeepLink(ticketKey: string): string {
    // Linear provides the URL directly in the API response
    return `${this.config.baseUrl}/issue/${ticketKey}`;
  }
}

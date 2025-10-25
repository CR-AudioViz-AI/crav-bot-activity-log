import type { TicketProvider, TicketInfo, ProviderConfig } from './base';

export class GitHubProvider implements TicketProvider {
  name = 'github';
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async fetchTicket(ticketKey: string): Promise<TicketInfo | null> {
    try {
      // ticketKey format: owner/repo#123
      const match = ticketKey.match(/^([^/]+)\/([^#]+)#(\d+)$/);
      if (!match) {
        console.error('Invalid GitHub ticket key format');
        return null;
      }

      const [, owner, repo, issueNumber] = match;

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
        {
          headers: {
            Authorization: `token ${this.config.token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        console.error(`GitHub API error: ${response.status}`);
        return null;
      }

      const data = await response.json();

      return {
        key: ticketKey,
        title: data.title,
        status: data.state,
        priority: data.labels.find((l: any) => l.name.startsWith('priority:'))?.name,
        assignee: data.assignee?.login,
        deepLink: this.generateDeepLink(ticketKey),
      };
    } catch (error) {
      console.error('Error fetching GitHub ticket:', error);
      return null;
    }
  }

  generateDeepLink(ticketKey: string): string {
    const match = ticketKey.match(/^([^/]+)\/([^#]+)#(\d+)$/);
    if (!match) return '';

    const [, owner, repo, issueNumber] = match;
    return `https://github.com/${owner}/${repo}/issues/${issueNumber}`;
  }
}

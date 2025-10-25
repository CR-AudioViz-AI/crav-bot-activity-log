export interface TicketProvider {
  name: string;
  fetchTicket(ticketKey: string): Promise<TicketInfo | null>;
  generateDeepLink(ticketKey: string): string;
}

export interface TicketInfo {
  key: string;
  title: string;
  status: string;
  priority?: string;
  assignee?: string;
  deepLink: string;
}

export interface ProviderConfig {
  baseUrl: string;
  token: string;
}

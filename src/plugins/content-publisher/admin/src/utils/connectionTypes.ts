// utils/connectionTypes.ts
//
// The signed-in accounts for LinkedIn and Facebook, as presentSettings in
// server/src/services/present-settings.ts summarises them. Never a token.

export type ConnectedAccount = {
  accountId: string;
  accountName: string;
  // null when the platform's token does not expire (Facebook Pages)
  expiresAt: string | null;
  connectedAt: string;
  // Facebook only: the Pages the editor granted
  pages?: { id: string; name: string }[];
};

export type ConnectionSummary = {
  // what to register as the redirect URL in the LinkedIn / Facebook app
  redirectUri: string;
  account: ConnectedAccount | null;
};

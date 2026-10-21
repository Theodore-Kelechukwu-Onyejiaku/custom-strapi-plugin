// platforms/connection-types.ts
//
// The shape of a signed-in LinkedIn or Facebook account, as stored in the settings. Kept out
// of types.ts so that file stays about field mapping.

// A Facebook Page the signed-in user manages. Each one has its own token.
export type ConnectedPage = { id: string; name: string; accessToken: string };

// One signed-in account. `accessToken` is encrypted at rest, as are the page tokens.
export type Connection = {
  accountId: string;
  accountName: string;
  accessToken: string;
  // null when the platform issues tokens that do not expire
  expiresAt: string | null;
  connectedAt: string;
  pages?: ConnectedPage[];
};

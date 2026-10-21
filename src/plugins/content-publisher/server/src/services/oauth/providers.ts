// services/oauth/providers.ts
//
// Every OAuth platform does the same two things: build the URL the editor signs in at, then
// trade the code it hands back for a token. Each provider file does those two for one site.

import type { Connection } from '../../platforms';
import { linkedInProvider } from './linkedin';
import { facebookProvider } from './facebook';

export type Secrets = Record<string, string | undefined>;

// A connection as the provider returns it: tokens still in plain text. connections.ts
// encrypts them before anything is stored.
export type RawConnection = Omit<Connection, 'connectedAt'>;

export type Provider = {
  authorizeUrl: (options: {
    secrets: Secrets;
    redirectUri: string;
    state: string;
    scopes: string[];
  }) => string;
  connect: (options: {
    code: string;
    secrets: Secrets;
    redirectUri: string;
  }) => Promise<RawConnection>;
};

const PROVIDERS: Record<string, Provider> = {
  linkedIn: linkedInProvider,
  facebook: facebookProvider,
};

export const getProvider = (platformKey: string): Provider | undefined => PROVIDERS[platformKey];

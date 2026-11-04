// services/oauth/linkedin.ts
//
// LinkedIn's three-legged OAuth:
// https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
// Tokens last 60 days and LinkedIn only issues refresh tokens to approved partners, so the
// editor reconnects when one runs out. The settings page shows when that is.

import axios from 'axios';

import type { Provider } from './providers';

const AUTHORIZE_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
export const USERINFO_URL ='https://api.linkedin.com/v2/userinfo';

export const linkedInProvider: Provider = {
  authorizeUrl({ secrets, redirectUri, state, scopes }) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: secrets.LINKEDIN_CLIENT_ID ?? '',
      redirect_uri: redirectUri,
      state,
      scope: scopes.join(' '),
    });
    return `${AUTHORIZE_URL}?${params}`;
  },

  async connect({ code, secrets, redirectUri }) {
    const form = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: secrets.LINKEDIN_CLIENT_ID ?? '',
      client_secret: secrets.LINKEDIN_CLIENT_SECRET ?? '',
    });

    const { data: token } = await axios.post(TOKEN_URL, form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    // the OpenID userinfo `sub` is the member id the post author URN is built from
    const { data: me } = await axios.get(USERINFO_URL, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    return {
      accountId: me.sub,
      accountName: me.name ?? me.email ?? 'LinkedIn member',
      accessToken: token.access_token,
      expiresAt: new Date(Date.now() + token.expires_in * 1000).toISOString(),
    };
  },
};

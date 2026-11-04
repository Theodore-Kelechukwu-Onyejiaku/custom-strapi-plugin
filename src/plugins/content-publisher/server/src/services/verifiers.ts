// services/verifiers.ts
//
// The cheapest authenticated, read-only call each platform offers, used by verify.ts to
// test a connection. Each returns the line shown to the editor when it works.

import axios from 'axios';

import { createSession } from './publishers/bluesky/session';
import { GRAPH_URL } from './oauth/facebook';
import { USERINFO_URL } from './oauth/linkedin';

type Secrets = Record<string, string | undefined>;

export const VERIFIERS: Record<string, (secrets: Secrets) => Promise<string>> = {
  async devTo(secrets) {
    const { data } = await axios.get('https://dev.to/api/users/me', {
      headers: { 'api-key': secrets.DEVTO_API_KEY as string },
    });
    return `Connected as @${data?.username ?? 'unknown'}`;
  },

  async medium(secrets) {
    const { data } = await axios.get('https://api.medium.com/v1/me', {
      headers: { Authorization: `Bearer ${secrets.MEDIUM_API_TOKEN}` },
    });

    const user = data?.data;
    // a token valid for a different account would publish somewhere unexpected
    if (user?.id && secrets.MEDIUM_USER_ID && user.id !== secrets.MEDIUM_USER_ID) {
      return `Token is valid, but it belongs to ${user.username} (${user.id}), not the configured MEDIUM_USER_ID`;
    }
    return `Connected as @${user?.username ?? 'unknown'}`;
  },

  async bluesky(secrets) {
    await createSession(secrets);
    return `Connected as ${secrets.BLUESKY_IDENTIFIER}`;
  },

  async linkedIn(secrets) {
    const { data } = await axios.get(USERINFO_URL, {
      headers: { Authorization: `Bearer ${secrets.ACCESS_TOKEN}` },
    });
    return `Connected as ${data?.name ?? 'unknown'}`;
  },

  async facebook(secrets) {
    const { data } = await axios.get(`${GRAPH_URL}/${secrets.ACCOUNT_ID}`, {
      params: { fields: 'name', access_token: secrets.ACCESS_TOKEN },
    });
    return `Connected to the Page ${data?.name ?? 'unknown'}`;
  },
};

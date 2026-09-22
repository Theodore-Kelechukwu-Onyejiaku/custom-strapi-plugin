// services/verify.ts
//
// Checks that a platform's credentials actually work, using the cheapest authenticated call
// each API offers. Read-only — nothing is published, nothing is changed.
//
// Always resolves to { ok, message } rather than throwing: a failed test is an answer, not a
// server error, and a thrown one would surface as a bare 500 (PROGRESS.md item 18).

import type { Core } from '@strapi/strapi';
import axios from 'axios';

import { getPlatform } from '../platforms';
import { resolveSecrets } from './credentials';
import { getSettings } from './settings-store';
import { createSession } from './publishers/bluesky/session';

type Secrets = Record<string, string | undefined>;

const VERIFIERS: Record<string, (secrets: Secrets) => Promise<string>> = {
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
};

export const verifyPlatform = async (strapi: Core.Strapi, platformKey: string) => {
  const platform = getPlatform(platformKey);
  if (!platform) return { ok: false, message: `"${platformKey}" is not a known platform.` };

  const secrets = resolveSecrets(strapi, await getSettings(strapi), platform);
  const missing = platform.envVars.filter((name) => !secrets[name]);
  if (missing.length > 0) {
    return { ok: false, message: `Missing ${missing.join(' and ')}.` };
  }

  const verifier = VERIFIERS[platformKey];
  if (!verifier) return { ok: false, message: `No connection test for ${platform.label} yet.` };

  try {
    return { ok: true, message: await verifier(secrets) };
  } catch (error: any) {
    const detail =
      error?.response?.data?.error ?? error?.response?.data?.message ?? error?.message ?? 'failed';
    return { ok: false, message: `${platform.label} rejected the credentials: ${detail}` };
  }
};

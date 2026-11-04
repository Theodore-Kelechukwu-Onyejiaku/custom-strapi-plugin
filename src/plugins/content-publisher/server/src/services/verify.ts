// services/verify.ts
//
// Checks that a platform's credentials actually work, using the cheapest authenticated call
// each API offers (verifiers.ts). Read-only — nothing is published, nothing is changed.
//
// Always resolves to { ok, message } rather than throwing: a failed test is an answer, not a
// server error, and a thrown one would surface as a bare 500 (PROGRESS.md item 18).

import type { Core } from '@strapi/strapi';

import { getPlatform } from '../platforms';
import { getSettings } from './settings-store';
import { secretsFor } from './publish-secrets';
import { VERIFIERS } from './verifiers';

export const verifyPlatform = async (strapi: Core.Strapi, platformKey: string) => {
  const platform = getPlatform(platformKey);
  if (!platform) return { ok: false, message: `"${platformKey}" is not a known platform.` };

  const verifier = VERIFIERS[platformKey];
  if (!verifier) return { ok: false, message: `No connection test for ${platform.label} yet.` };

  // the same keys or connection publishing would use; its error already says what is missing
  let secrets: Record<string, string | undefined>;
  try {
    secrets = await secretsFor(strapi, await getSettings(strapi), platform);
  } catch (error: any) {
    return { ok: false, message: error?.message ?? 'Not set up yet.' };
  }

  try {
    return { ok: true, message: await verifier(secrets) };
  } catch (error: any) {
    const data = error?.response?.data;
    const detail = data?.error?.message ?? data?.error ?? data?.message ?? error?.message;
    return {
      ok: false,
      message: `${platform.label} rejected the credentials: ${detail ?? 'failed'}`,
    };
  }
};

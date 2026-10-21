// services/oauth/state.ts
//
// The `state` value sent to the provider and checked when it redirects back. The callback
// route cannot require an admin login (the provider is what calls it), so this one-time,
// short-lived value is what proves the request was started from this admin panel.

import crypto from 'crypto';
import type { Core } from '@strapi/strapi';

// ten minutes is plenty to sign in, and short enough that a leaked URL is useless
const TTL_MS = 10 * 60 * 1000;

type Pending = { platform: string; redirectUri: string; expiresAt: number };

const store = (strapi: Core.Strapi) =>
  strapi.store({ type: 'plugin', name: 'content-publisher', key: 'oauth-states' });

const load = async (strapi: Core.Strapi) =>
  ((await store(strapi).get({})) ?? {}) as Record<string, Pending>;

// drops anything expired, so abandoned sign-ins do not pile up
const fresh = (all: Record<string, Pending>) =>
  Object.fromEntries(Object.entries(all).filter(([, one]) => one.expiresAt > Date.now()));

export const createState = async (strapi: Core.Strapi, platform: string, redirectUri: string) => {
  const state = crypto.randomBytes(24).toString('hex');
  const all = fresh(await load(strapi));

  all[state] = { platform, redirectUri, expiresAt: Date.now() + TTL_MS };
  await store(strapi).set({ value: all });
  return state;
};

// Returns the pending sign-in and deletes it, so the same state can never be replayed.
export const consumeState = async (strapi: Core.Strapi, state: unknown, platform: string) => {
  if (typeof state !== 'string') return null;

  const all = fresh(await load(strapi));
  const pending = all[state];
  delete all[state];
  await store(strapi).set({ value: all });

  return pending?.platform === platform ? pending : null;
};

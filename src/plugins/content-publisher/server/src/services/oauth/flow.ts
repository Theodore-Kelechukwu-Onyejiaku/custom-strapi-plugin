// services/oauth/flow.ts
//
// The two halves of a sign-in. `startSignIn` builds the provider URL the popup opens;
// `finishSignIn` runs when the provider redirects back with a code.

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

import type { Platform } from '../../platforms';
import type { Provider } from './providers';
import { resolveSecrets } from '../credentials';
import { createState, consumeState } from './state';
import { saveConnection } from './connections';

const { ValidationError } = errors;

// Must match, character for character, the redirect URL registered in the provider's app.
export const redirectUriFor = (strapi: Core.Strapi, platformKey: string) =>
  `${strapi.config.get('server.absoluteUrl')}/content-publisher/connect/${platformKey}/callback`;

export const startSignIn = async (strapi: Core.Strapi, platform: Platform, provider: Provider) => {
  const secrets = resolveSecrets(platform);

  const missing = platform.envVars.filter((name) => !secrets[name]);
  if (missing.length) {
    throw new ValidationError(
      `Add ${missing.join(' and ')} to the .env file and restart Strapi before connecting.`
    );
  }

  const redirectUri = redirectUriFor(strapi, platform.key);
  const state = await createState(strapi, platform.key, redirectUri);
  const scopes = platform.oauth?.scopes ?? [];
  return { url: provider.authorizeUrl({ secrets, redirectUri, state, scopes }) };
};

// Never throws: the result is shown as a page in the popup, not returned to the admin app.
export const finishSignIn = async (
  strapi: Core.Strapi,
  platform: Platform,
  provider: Provider,
  query: Record<string, any>
) => {
  if (query.error) {
    const reason = query.error_description ?? `${platform.label} sign-in was cancelled.`;
    return { ok: false, message: reason };
  }

  const pending = await consumeState(strapi, query.state, platform.key);
  if (!pending) {
    return { ok: false, message: 'This sign-in link has expired. Try connecting again.' };
  }

  try {
    const code = String(query.code ?? '');
    const secrets = resolveSecrets(platform);
    const raw = await provider.connect({ code, secrets, redirectUri: pending.redirectUri });

    await saveConnection(strapi, platform.key, raw);
    return { ok: true, message: `Connected ${platform.label} as ${raw.accountName}.` };
  } catch (error: any) {
    const data = error?.response?.data;
    const detail = data?.error_description ?? data?.error?.message ?? error?.message;
    return { ok: false, message: `Could not connect ${platform.label}: ${detail}` };
  }
};

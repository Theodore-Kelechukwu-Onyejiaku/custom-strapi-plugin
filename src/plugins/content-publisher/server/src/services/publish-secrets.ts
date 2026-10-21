// services/publish-secrets.ts
//
// What a publisher is handed to authenticate with. Split out of publish.ts because there are
// now two kinds of platform: one you paste a key into, and one you sign in to.

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

import type { Platform, Settings } from '../platforms';
import { resolveSecrets } from './credentials';
import { connectionSecrets } from './oauth/connections';

const { ApplicationError } = errors;

// An API-key platform needs its keys. A sign-in platform needs only the stored connection —
// its client id and secret were for connecting, not for publishing.
export const secretsFor = async (strapi: Core.Strapi, settings: Settings, platform: Platform) => {
  if (platform.oauth) {
    const result = connectionSecrets(strapi, settings, platform);
    if (!result.secrets) throw new ApplicationError(result.problem);
    return result.secrets as Record<string, string | undefined>;
  }

  // keys live in .env only; missing entirely is worth saying plainly
  const secrets = resolveSecrets(platform);
  const missing = platform.envVars.filter((name) => !secrets[name]);
  if (missing.length) {
    throw new ApplicationError(
      `${platform.label} is missing ${missing.join(', ')}. Add it to the .env file and restart Strapi.`
    );
  }
  return secrets;
};

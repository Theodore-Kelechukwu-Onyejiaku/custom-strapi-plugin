// services/credentials.ts
//
// The platform API keys. Stored encrypted with Strapi's own admin::encryption service —
// the same AES-256-GCM used for API tokens, keyed off `admin.secrets.encryptionKey`.
//
// The plaintext key never leaves this file: publishers receive it, the admin panel gets
// only the summary below.

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import type { Platform, Settings } from '../platforms';

const { ValidationError } = errors;

const encryption = (strapi: Core.Strapi): any => strapi.service('admin::encryption');

// Refuses rather than falling back to plaintext: a key silently stored unencrypted would
// sit in every database backup looking as though it were protected.
export const encryptValue = (strapi: Core.Strapi, value: string): string => {
  const encrypted = encryption(strapi)?.encrypt(value);
  if (!encrypted) {
    throw new ValidationError(
      'Cannot store an API key until an encryption key is configured. Set ENCRYPTION_KEY and read it in config/admin as admin.secrets.encryptionKey.'
    );
  }
  return encrypted;
};

// A key saved in the admin panel wins over the environment, so one can be rotated without
// a redeploy. The env var stays the fallback.
export const resolveCredential = (
  strapi: Core.Strapi,
  settings: Settings,
  platformKey: string,
  name: string
): string | undefined => {
  const stored = settings.credentials?.[platformKey]?.[name];

  if (stored) {
    const value = encryption(strapi)?.decrypt(stored);
    if (value) return value;
    strapi.log.warn(`[content-publisher] Could not decrypt ${name}, using the environment.`);
  }

  return process.env[name];
};

export const resolveSecrets = (strapi: Core.Strapi, settings: Settings, platform: Platform) => {
  const secrets: Record<string, string | undefined> = {};
  for (const name of platform.envVars) {
    secrets[name] = resolveCredential(strapi, settings, platform.key, name);
  }
  return secrets;
};

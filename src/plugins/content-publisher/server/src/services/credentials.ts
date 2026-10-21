// services/credentials.ts
//
// Platform API keys come from the .env file only. They cannot be entered in the admin panel:
// a key pasted into a form ends up in the database, in every backup of it, and in front of
// anyone looking over the editor's shoulder. The admin panel only learns whether each one
// is set (services/present-settings.ts).
//
// The encryption helper is still here because the LinkedIn and Facebook sign-in tokens are
// stored — they are issued at runtime, so there is no .env to put them in.

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import type { Platform } from '../platforms';

const { ValidationError } = errors;

const encryption = (strapi: Core.Strapi): any => strapi.service('admin::encryption');

// Refuses rather than falling back to plaintext: a token silently stored unencrypted would
// sit in every database backup looking as though it were protected.
export const encryptValue = (strapi: Core.Strapi, value: string): string => {
  const encrypted = encryption(strapi)?.encrypt(value);
  if (!encrypted) {
    throw new ValidationError(
      'Cannot store a sign-in token until an encryption key is configured. Set ENCRYPTION_KEY and read it in config/admin as admin.secrets.encryptionKey.'
    );
  }
  return encrypted;
};

// One platform's keys, read straight from the environment.
export const resolveSecrets = (platform: Platform) => {
  const secrets: Record<string, string | undefined> = {};
  for (const name of platform.envVars) {
    secrets[name] = process.env[name] || undefined;
  }
  return secrets;
};

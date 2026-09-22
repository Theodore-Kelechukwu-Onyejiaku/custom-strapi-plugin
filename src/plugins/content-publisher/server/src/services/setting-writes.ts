// services/setting-writes.ts
//
// The non-credential settings writes. Each returns the raw stored settings; setting.ts is
// what passes them through presentSettings before they reach the admin panel.

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { isCollectionType } from './content-types';
import { getSettings, saveSettings } from './settings-store';
import { validateMapping } from './mapping-validator';
import { encryptValue } from './credentials';
import type { Platform } from '../platforms';

const { ValidationError } = errors;

export const setContentTypes = async (strapi: Core.Strapi, uids: unknown) => {
  if (!Array.isArray(uids) || uids.some((uid) => typeof uid !== 'string')) {
    throw new ValidationError('contentTypes must be an array of content type uids');
  }

  const missing = uids.find((uid) => !isCollectionType(strapi, uid));
  if (missing) {
    throw new ValidationError(`"${missing}" is not a collection type`);
  }
  return saveSettings(strapi, { contentTypes: uids });
};

export const updatePlatform = async (
  strapi: Core.Strapi,
  platform: Platform,
  value: unknown
) => {
  validateMapping(strapi, platform, value);
  const { platforms } = await getSettings(strapi);
  return saveSettings(strapi, { platforms: { ...platforms, [platform.key]: value as any } });
};

export const setEnabled = async (strapi: Core.Strapi, platform: Platform, value: unknown) => {
  if (typeof value !== 'boolean') {
    throw new ValidationError('enabled must be true or false');
  }
  const { enabled } = await getSettings(strapi);
  return saveSettings(strapi, { enabled: { ...enabled, [platform.key]: value } });
};

// Saves one platform's API key. An empty value clears it, which falls the lookup back to
// the environment rather than leaving a stale key behind.
export const setCredential = async (
  strapi: Core.Strapi,
  platform: Platform,
  name: unknown,
  value: unknown
) => {
  if (typeof name !== 'string' || !platform.envVars.includes(name)) {
    throw new ValidationError(`"${name}" is not a ${platform.label} credential`);
  }
  if (typeof value !== 'string') {
    throw new ValidationError('value must be a string');
  }

  const settings = await getSettings(strapi);
  const forPlatform = { ...(settings.credentials?.[platform.key] ?? {}) };

  if (value === '') delete forPlatform[name];
  else forPlatform[name] = encryptValue(strapi, value);

  return saveSettings(strapi, {
    credentials: { ...settings.credentials, [platform.key]: forPlatform },
  });
};

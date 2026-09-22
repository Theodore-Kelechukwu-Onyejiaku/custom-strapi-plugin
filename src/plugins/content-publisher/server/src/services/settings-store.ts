// services/settings-store.ts
//
// Where the settings live and how they are merged. Settings sit in Strapi's core store
// rather than a content type — the same place upload and i18n keep theirs — because they
// are admin-only configuration, not content.

import type { Core } from '@strapi/strapi';
import { EMPTY_SETTINGS } from '../platforms';
import type { Settings } from '../platforms';

const store = (strapi: Core.Strapi) =>
  strapi.store({ type: 'plugin', name: 'content-publisher', key: 'settings' });

// the saved settings, filled in with defaults so callers never see null
export const getSettings = async (strapi: Core.Strapi): Promise<Settings> => {
  const saved = (await store(strapi).get({})) as Partial<Settings> | null;
  return { ...EMPTY_SETTINGS, ...(saved ?? {}) };
};

// merges a patch into what is saved, so saving one part never clobbers another
export const saveSettings = async (strapi: Core.Strapi, patch: Partial<Settings>) => {
  const next: Settings = { ...(await getSettings(strapi)), ...patch };
  await store(strapi).set({ value: next });
  return next;
};

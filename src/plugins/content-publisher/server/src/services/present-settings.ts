// services/present-settings.ts
//
// What leaves the server. The stored settings hold encrypted API keys, which the admin
// panel has no use for and should never receive, so they are swapped for a summary before
// anything is sent back.

import type { Core } from '@strapi/strapi';
import { PLATFORMS } from '../platforms';
import type { Platform, Settings } from '../platforms';
import { resolveCredential } from './credentials';

// Whether a key is set, where it came from, and its last four characters so an operator
// can tell which key is in place. Never the key itself.
const summarise = (strapi: Core.Strapi, settings: Settings, platform: Platform) => {
  const summary: Record<string, any> = {};

  for (const name of platform.envVars) {
    const value = resolveCredential(strapi, settings, platform.key, name);
    const stored = Boolean(settings.credentials?.[platform.key]?.[name]);

    summary[name] = {
      configured: Boolean(value),
      source: stored ? 'settings' : value ? 'env' : null,
      last4: value ? value.slice(-4) : null,
    };
  }

  return summary;
};

export const presentSettings = (strapi: Core.Strapi, settings: Settings) => ({
  ...settings,
  credentials: Object.fromEntries(
    PLATFORMS.map((platform) => [platform.key, summarise(strapi, settings, platform)])
  ),
});

// The little that the publish surfaces need: which collection types are publishable, and
// which platforms are switched on. Deliberately excludes mappings and credentials, so it can
// sit behind the plugin's `read` action — an editor who may publish but may not open the
// settings page still gets a correct menu.
export const publishTargets = (settings: Settings) => ({
  contentTypes: settings.contentTypes,
  platforms: PLATFORMS.map((platform) => ({
    key: platform.key,
    label: platform.label,
    // missing means on, the same default the publish path applies
    enabled: settings.enabled?.[platform.key] !== false,
  })),
});

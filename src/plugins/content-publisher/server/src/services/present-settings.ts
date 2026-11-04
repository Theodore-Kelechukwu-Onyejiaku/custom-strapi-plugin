// services/present-settings.ts
//
// What leaves the server. API keys live in .env and sign-in tokens are encrypted in the
// store; the admin panel gets neither — only whether each key is set, and who is signed in.

import type { Core } from '@strapi/strapi';
import { PLATFORMS } from '../platforms';
import type { Platform, Settings } from '../platforms';
import { resolveSecrets } from './credentials';
import { presentConnection } from './oauth/connections';
import { redirectUriFor } from './oauth/flow';

// Whether each env var is set. Not even part of the value is sent, so nothing about a key
// can be read off the settings page or the network tab.
const summarise = (platform: Platform) => {
  const secrets = resolveSecrets(platform);
  return Object.fromEntries(
    platform.envVars.map((name) => [name, { configured: Boolean(secrets[name]) }])
  );
};

export const presentSettings = (strapi: Core.Strapi, settings: Settings) => ({
  ...settings,
  credentials: Object.fromEntries(PLATFORMS.map((platform) => [platform.key, summarise(platform)])),
  // replaces the stored connections, which hold encrypted tokens. The redirect URL is sent
  // so the settings page can show what to register in the provider's app.
  connections: Object.fromEntries(
    PLATFORMS.filter((platform) => platform.oauth).map((platform) => [
      platform.key,
      {
        redirectUri: redirectUriFor(strapi, platform.key),
        account: presentConnection(settings.connections?.[platform.key]),
      },
    ])
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

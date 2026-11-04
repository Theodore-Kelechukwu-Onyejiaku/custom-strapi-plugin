// services/platform-status.ts
//
// Which platforms can be published to right now, and if not, why. Used by the MCP tool so
// the chat can say "LinkedIn isn't connected" instead of attempting a publish that fails.

import type { Core } from '@strapi/strapi';

import { PLATFORMS } from '../platforms';
import { getSettings } from './settings-store';
import { secretsFor } from './publish-secrets';

export const platformStatus = async (strapi: Core.Strapi) => {
  const settings = await getSettings(strapi);

  return Promise.all(
    PLATFORMS.map(async (platform) => {
      // the same check publishing makes; its error already says what is missing
      const problem = await secretsFor(strapi, settings, platform)
        .then(() => null)
        .catch((error: any) => String(error?.message ?? 'Not set up.'));

      return {
        key: platform.key,
        label: platform.label,
        // a missing flag means enabled, as in publish.ts
        enabled: settings.enabled?.[platform.key] !== false,
        ready: problem === null,
        problem,
      };
    })
  );
};

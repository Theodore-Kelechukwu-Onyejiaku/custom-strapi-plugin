// services/setting.ts
//
// Thin wiring. Writes live in setting-writes.ts, the store in settings-store.ts. API keys
// are read from .env (credentials.ts) and are never written from here.

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { PLATFORMS, getPlatform } from '../platforms';
import { listContentTypes } from './content-types';
import { getSettings } from './settings-store';
import { presentSettings, publishTargets } from './present-settings';
import * as writes from './setting-writes';
import { syncTrackingRecords } from './backfill';
import { verifyPlatform } from './verify';
import { platformStatus } from './platform-status';

const { ValidationError } = errors;

const settingService = ({ strapi }: { strapi: Core.Strapi }) => ({
  async find() {
    return {
      platforms: PLATFORMS,
      contentTypes: listContentTypes(strapi),
      settings: presentSettings(strapi, await getSettings(strapi)),
    };
  },

  async publishTargets() {
    return publishTargets(await getSettings(strapi));
  },

  async setContentTypes(uids: unknown) {
    const saved = await writes.setContentTypes(strapi, uids);
    await syncTrackingRecords(strapi); // so a new type shows its existing entries at once
    return presentSettings(strapi, saved);
  },

  async updatePlatform(platformKey: string, value: unknown) {
    const platform = this.requirePlatform(platformKey);
    return presentSettings(strapi, await writes.updatePlatform(strapi, platform, value));
  },

  async setEnabled(platformKey: string, value: unknown) {
    const platform = this.requirePlatform(platformKey);
    return presentSettings(strapi, await writes.setEnabled(strapi, platform, value));
  },

  async testPlatform(platformKey: string) {
    return verifyPlatform(strapi, platformKey);
  },

  // is each platform on, and are its keys / sign-in ready?
  async platformStatus() {
    return platformStatus(strapi);
  },

  requirePlatform(platformKey: string) {
    const platform = getPlatform(platformKey);
    if (!platform) {
      throw new ValidationError(`"${platformKey}" is not a known platform`);
    }
    return platform;
  },
});

export default settingService;

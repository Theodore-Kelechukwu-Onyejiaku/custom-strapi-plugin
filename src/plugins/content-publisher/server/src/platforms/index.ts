// platforms/index.ts
//
// The source of truth for the settings page — this list is served to the admin panel so
// the field rows and their dropdowns are never hardcoded in the UI.
//
// To add a platform: write a file next to this one, then add it to PLATFORMS below and a
// publish function in services/service.ts.

import devTo from './devto';
import medium from './medium';
import bluesky from './bluesky';
import linkedIn from './linkedin';
import facebook from './facebook';
import type { Platform, Settings } from './types';

export * from './types';
export * from './connection-types';

export const PLATFORMS: Platform[] = [devTo, medium, bluesky, linkedIn, facebook];

export const getPlatform = (key: string): Platform | undefined =>
  PLATFORMS.find((platform) => platform.key === key);

export const EMPTY_SETTINGS: Settings = {
  contentTypes: [],
  platforms: {},
  enabled: {},
  connections: {},
};

// Suffix used for a relation field's item attribute, e.g. `tags__item` holds `blogTag`.
export const ITEM_SUFFIX = '__item';

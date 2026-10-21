// platforms/types.ts
//
// The shapes the settings feature works with. Kept apart from the platform list so each
// platform file can import these without pulling in every other platform.

import type { Connection } from './connection-types';

// Strapi attribute types a platform field may be mapped to. The settings page filters
// each dropdown by this, so a title field never offers an image attribute.
export type AcceptedType = 'string' | 'text' | 'richtext' | 'uid' | 'email' | 'media' | 'relation';

export type PlatformField = {
  // the key in the platform's API payload, e.g. dev.to's `body_markdown`
  key: string;
  label: string;
  required: boolean;
  accepts: AcceptedType[];
  hint?: string;
};

export type Platform = {
  key: string;
  label: string;
  fields: PlatformField[];
  // env vars needed to publish. Not editable from the admin panel; the settings page only
  // reports whether they are present.
  envVars: string[];
  // Values sent with every request that are not sourced from a content type, so they are
  // shown read-only in the settings page rather than as dropdowns.
  fixedOptions?: Record<string, unknown>;
  // Set for sign-in (OAuth) platforms: `envVars` is then the app's id and secret, from .env.
  oauth?: { scopes: string[] };
};

// One collection type's mapping: platform field key -> attribute name on that type.
// Relation fields also record which attribute on the related entry holds the text, under
// `<fieldKey>__item`.
export type FieldMap = Record<string, string | null>;

// A platform's whole mapping, keyed by content type uid. Keyed this way because two
// collection types can name the same concept differently — a Blog's `body` and an
// Article's `section` both feed dev.to's `body_markdown`.
export type PlatformMap = Record<string, FieldMap>;

export type Settings = {
  // collection types the editor publishes from
  contentTypes: string[];
  // platform key -> PlatformMap
  platforms: Record<string, PlatformMap>;
  // platform key -> whether it may be published to. Missing means enabled, so an install
  // that upgrades without touching the settings page keeps publishing as it did.
  enabled: Record<string, boolean>;
  // platform key -> the account signed in through OAuth. Tokens encrypted, never sent out.
  connections: Record<string, Connection>;
};

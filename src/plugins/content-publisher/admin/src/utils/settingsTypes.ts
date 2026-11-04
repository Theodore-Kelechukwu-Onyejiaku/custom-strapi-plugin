// utils/settingsTypes.ts
//
// The shapes GET /content-publisher/settings returns. Mirrors server/src/platforms/types.ts
// — change one and change the other.

import type { ConnectionSummary } from './connectionTypes';

export type { ConnectedAccount, ConnectionSummary } from './connectionTypes';

export type Attribute = { name: string; type: string; target?: string };

export type ContentType = { uid: string; displayName: string; attributes: Attribute[] };

export type PlatformField = {
  key: string;
  label: string;
  required: boolean;
  accepts: string[];
  hint?: string;
};

export type Platform = {
  key: string;
  label: string;
  fields: PlatformField[];
  envVars: string[];
  // set when the editor signs in (LinkedIn, Facebook) rather than pasting a key
  oauth?: { scopes: string[] };
};

// platform field key -> attribute name on one collection type
export type FieldMap = Record<string, string | null>;

// content type uid -> that type's FieldMap
export type PlatformMap = Record<string, FieldMap>;

export type Settings = {
  contentTypes: string[];
  platforms: Record<string, PlatformMap>;
  // missing means enabled, so an upgrade keeps publishing as it did
  enabled: Record<string, boolean>;
  // platform key -> env var name -> whether it is set in .env. Never the value itself.
  credentials: Record<string, Record<string, CredentialSummary>>;
  // platform key -> who is signed in, for the OAuth platforms only
  connections: Record<string, ConnectionSummary>;
};

export type CredentialSummary = { configured: boolean };

export type SettingsResponse = {
  platforms: Platform[];
  contentTypes: ContentType[];
  settings: Settings;
};

// A relation stores two values: `tags` names the relation, `tags__item` names the
// attribute on the related type that holds the text.
export const ITEM_SUFFIX = '__item';

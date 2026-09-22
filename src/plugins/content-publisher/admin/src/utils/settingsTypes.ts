// utils/settingsTypes.ts
//
// The shapes GET /content-publisher/settings returns. Mirrors server/src/platforms/types.ts
// — change one and change the other.

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
  fixedOptions?: Record<string, unknown>;
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
  // platform key -> env var name -> summary. Never the key itself: the server replaces the
  // encrypted values with this before responding.
  credentials: Record<string, Record<string, CredentialSummary>>;
};

export type CredentialSummary = {
  configured: boolean;
  // where the key in effect came from, or null when none is set
  source: 'settings' | 'env' | null;
  last4: string | null;
};

export type SettingsResponse = {
  platforms: Platform[];
  contentTypes: ContentType[];
  settings: Settings;
};

// A relation stores two values: `tags` names the relation, `tags__item` names the
// attribute on the related type that holds the text.
export const ITEM_SUFFIX = '__item';

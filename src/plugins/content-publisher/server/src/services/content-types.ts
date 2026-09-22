// services/content-types.ts
//
// Builds the list of collection types the settings page offers, with their attributes, so
// the page can render real dropdowns instead of free-text fields.

import type { Core } from '@strapi/strapi';

// Content types nobody would publish from — Strapi internals and the plugin's own types.
const isHidden = (uid: string) =>
  uid.startsWith('admin::') ||
  uid.startsWith('strapi::') ||
  uid.startsWith('plugin::upload.') ||
  uid.startsWith('plugin::i18n.') ||
  uid.startsWith('plugin::review-workflows.') ||
  uid.startsWith('plugin::content-releases.') ||
  uid.startsWith('plugin::users-permissions.') ||
  uid.startsWith('plugin::content-publisher.');

// Attributes Strapi manages itself, which can never be mapped to a platform field.
const MANAGED = [
  'id',
  'documentId',
  'createdAt',
  'updatedAt',
  'publishedAt',
  'createdBy',
  'updatedBy',
  'locale',
];

// `target` is carried through for relations: the settings page needs it to offer the
// attributes of the *related* type once a relation is picked.
const toAttributes = (contentType: any) =>
  Object.entries(contentType.attributes ?? {})
    .filter(([name]) => !MANAGED.includes(name))
    .map(([name, attribute]: [string, any]) => ({
      name,
      type: attribute.type,
      ...(attribute.target ? { target: attribute.target } : {}),
    }));

export const getContentType = (strapi: Core.Strapi, uid: string): any =>
  strapi.contentTypes[uid as keyof typeof strapi.contentTypes];

export const isCollectionType = (strapi: Core.Strapi, uid: string) => {
  const contentType = getContentType(strapi, uid);
  return Boolean(contentType) && contentType.kind === 'collectionType';
};

export const listContentTypes = (strapi: Core.Strapi) =>
  Object.values(strapi.contentTypes)
    .filter((contentType: any) => contentType.kind === 'collectionType' && !isHidden(contentType.uid))
    .map((contentType: any) => ({
      uid: contentType.uid,
      displayName: contentType.info?.displayName ?? contentType.uid,
      attributes: toAttributes(contentType),
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

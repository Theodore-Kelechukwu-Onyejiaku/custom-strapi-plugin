// services/resolve-fields.ts
//
// Reads an entry's values through a saved mapping, so the publish payloads below no
// longer name `api::blog.blog` fields directly. An unmapped field resolves to null and
// the publisher leaves it out.

import type { Core } from '@strapi/strapi';
import { ITEM_SUFFIX } from '../platforms';
import type { FieldMap, Platform, PlatformField } from '../platforms';

/**
 * Turns a media object into a URL an external API can actually fetch. Uploads are stored
 * relative ("/uploads/x.png"), which dev.to and Medium cannot resolve, so prefix the
 * server's absolute URL. Providers like S3 and Cloudinary already return absolute URLs.
 */
export const mediaUrl = (media: any, strapi: Core.Strapi): string | null => {
  const url = media?.url;
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${strapi.config.get('server.absoluteUrl', '')}${url}`;
};

// A relation resolves to the text of each related entry, read from the attribute the
// mapping recorded under `<fieldKey>__item`. Without that we cannot know which attribute
// holds the text, so there is nothing to send.
const relationValues = (raw: any, itemName: string | null): string[] => {
  if (!itemName) return [];
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return list.map((item) => item?.[itemName]).filter(Boolean);
};

const readValue = (
  strapi: Core.Strapi,
  attributes: any,
  fieldMap: FieldMap,
  field: PlatformField,
  entry: any,
  name: string
) => {
  const type = attributes?.[name]?.type;
  const raw = entry?.[name];

  if (type === 'media') return mediaUrl(raw, strapi);
  if (type === 'relation') return relationValues(raw, fieldMap[`${field.key}${ITEM_SUFFIX}`]);
  return raw ?? null;
};

export const resolveFields = (
  strapi: Core.Strapi,
  uid: string,
  platform: Platform,
  fieldMap: FieldMap,
  entry: any
): Record<string, any> => {
  const attributes = (strapi.contentTypes as any)?.[uid]?.attributes ?? {};
  const values: Record<string, any> = {};

  for (const field of platform.fields) {
    const name = fieldMap?.[field.key];
    values[field.key] = name ? readValue(strapi, attributes, fieldMap, field, entry, name) : null;
  }

  return values;
};

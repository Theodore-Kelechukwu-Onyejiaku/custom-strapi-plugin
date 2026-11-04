// services/tracking.ts
//
// Keeps one tracking record per published-from entry. The record stores the entry's uid and
// documentId plus a snapshot of its title and updated date, so the table can list and search
// in one query rather than looking every entry up across several content types.

import type { Core } from '@strapi/strapi';

import { POST_UID } from './publish-config';
import { getSettings } from './settings-store';

// Attributes commonly used as a heading, tried in order. The editor's own mapping wins over
// these — see titleOf below — this is only the fallback when nothing is mapped.
const TITLE_KEYS = ['title', 'name', 'heading', 'label'];

const titleOf =(entry: any, mappedTitle?: string | null) => {
  if (mappedTitle && entry?.[mappedTitle]) return String(entry[mappedTitle]);

  const key = TITLE_KEYS.find((one) => entry?.[one]);
  return key ? String(entry[key]) : `Entry ${entry?.documentId ?? ''}`.trim();
};

// The attribute the editor mapped to a platform's "title" field, if any. Whichever platform
// is mapped first is good enough: they all point at the same heading in practice.
const mappedTitleFor = async (strapi: Core.Strapi, uid: string) => {
  const { platforms } = await getSettings(strapi);

  for (const mapping of Object.values(platforms ?? {})) {
    const attribute = (mapping as any)?.[uid]?.title;
    if (attribute) return attribute as string;
  }
  return null;
};

/**
 * The published version of a document, or null when there is none.
 *
 * Deliberately not read off the row the lifecycle handed us: with draft & publish, Strapi 5
 * keeps two rows per document and the draft one always has `publishedAt: null`. Editing a
 * published entry fires on the draft, so trusting that row would mark it unpublished. A type
 * without draft & publish has no unpublished state, so its only entry always counts.
 * `populate` is for publishing, which needs the entry's relations and media.
 */
export const publishedVersion = async (
  strapi: Core.Strapi, uid: string, documentId: string, populate?: unknown
) => {
  const contentType: any = (strapi.contentTypes as any)[uid];
  const status = contentType?.options?.draftAndPublish ? { status: 'published' as const } : {};

  return strapi.documents(uid as any).findOne({ documentId, ...status, populate: populate as any });
};

export const snapshotOf = async (
  strapi: Core.Strapi,
  uid: string,
  entry: any,
  published: boolean
) => ({
  contentType: uid,
  entryId: entry.documentId,
  title: titleOf(entry, await mappedTitleFor(strapi, uid)),
  entryUpdatedAt: entry.updatedAt ?? new Date().toISOString(),
  entryPublished: published,
});

export const findRecord = (strapi: Core.Strapi, uid: string, documentId: string) =>
  strapi.documents(POST_UID).findFirst({
    filters: { contentType: { $eq: uid }, entryId: { $eq: documentId } },
  });

// services/tracking-sync.ts
//
// Keeps a tracking record in step with the entry it points at.
//
// Unpublishing flips a flag rather than deleting the record: the record holds the URLs of
// everywhere the entry was already published, and losing those because someone moved an entry
// back to draft would be destructive. The table filters on the flag instead.

import type { Core } from '@strapi/strapi';

import { POST_UID } from './publish-config';
import { findRecord, publishedVersion, snapshotOf } from './tracking';

// The plugin compiles without the host's generated content-type registry, so the document
// service's Input<> type cannot know this plugin's own attributes.
const asData = (value: Record<string, unknown>): any => value;

export const onEntryChanged = async (strapi: Core.Strapi, uid: string, entry: any) => {
  if (!entry?.documentId) return;

  // ask the document service rather than trusting the row we were handed — see tracking.ts
  const published = await publishedVersion(strapi, uid, entry.documentId);
  // the published version is what would actually be syndicated, so snapshot that when it exists
  const snapshot = await snapshotOf(strapi, uid, published ?? entry, Boolean(published));
  const existing = await findRecord(strapi, uid, entry.documentId);

  if (existing) {
    await strapi.documents(POST_UID).update({
      documentId: existing.documentId,
      data: asData(snapshot),
    });
    return;
  }

  // the link fields start empty, so only the snapshot is written
  await strapi.documents(POST_UID).create({ data: asData(snapshot) });
};

export const onEntryRemoved = async (strapi: Core.Strapi, uid: string, documentId?: string) => {
  if (!documentId) return;

  const existing = await findRecord(strapi, uid, documentId);
  if (existing) {
    await strapi.documents(POST_UID).delete({ documentId: existing.documentId });
  }
};

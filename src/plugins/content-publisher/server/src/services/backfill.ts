// services/backfill.ts
//
// Reconciles tracking records with what is actually in the configured collection types.
// Lifecycles alone would miss entries that already existed when a type was ticked, and would
// never correct a record that has drifted. Idempotent, so it runs on boot and again whenever
// the selection changes.

import type { Core } from '@strapi/strapi';

import { POST_UID } from './publish-config';
import { getSettings } from './settings-store';
import { onEntryChanged, onEntryRemoved } from './tracking-sync';

// Enough for any realistic content set. A project past this gets its most recent entries
// reconciled, and the rest as they are edited.
const SCAN_LIMIT = 1000;

const recordsFor = (strapi: Core.Strapi, uid: string) =>
  strapi.documents(POST_UID).findMany({
    filters: { contentType: { $eq: uid } },
    limit: SCAN_LIMIT,
  });

export const syncTrackingRecords = async (strapi: Core.Strapi) => {
  const { contentTypes } = await getSettings(strapi);
  let touched = 0;

  for (const uid of contentTypes) {
    if (!(strapi.contentTypes as any)[uid]) continue;

    // every document, draft or not: onEntryChanged decides what the record should say
    const entries: any[] = await strapi.documents(uid as any).findMany({ limit: SCAN_LIMIT });
    const seen = new Set(entries.map((entry) => entry.documentId));

    for (const entry of entries) {
      await onEntryChanged(strapi, uid, entry);
      touched += 1;
    }

    // records whose entry has since been deleted outright
    const records: any[] = await recordsFor(strapi, uid);
    for (const record of records) {
      if (!seen.has(record.entryId)) {
        await onEntryRemoved(strapi, uid, record.entryId);
      }
    }
  }

  if (touched > 0) {
    strapi.log.info(`[content-publisher] Reconciled ${touched} tracked entries.`);
  }
  return touched;
};

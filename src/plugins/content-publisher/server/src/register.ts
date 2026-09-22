// register.ts
//
// Keeps a tracking record in step with every entry of a configured collection type.
//
// The subscription deliberately has no `models` filter: which types are publishable is a
// runtime setting, so a fixed list would go stale the moment it changed. Every model is seen
// and the handler checks current settings, so ticking a type works with no restart.

import type { Core } from '@strapi/strapi';

import { POST_UID } from './services/publish-config';
import { getSettings } from './services/settings-store';
import { onEntryChanged, onEntryRemoved } from './services/tracking-sync';

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  // also guards against reacting to our own writes, which would recurse
  const isTracked = async (uid: string) => {
    if (uid === POST_UID) return false;
    const { contentTypes } = await getSettings(strapi);
    return contentTypes.includes(uid);
  };

  // Create, update, publish and unpublish all land here. With draft & publish, publishing
  // writes the published row and unpublishing removes it, so both show up as a create or
  // delete on a row — which is why the handler re-resolves the document's real state rather
  // than reading the row it was given.
  const sync = async (event: any) => {
    const uid = event.model?.uid;
    if (await isTracked(uid)) {
      await onEntryChanged(strapi, uid, event.result);
    }
  };

  strapi.db.lifecycles.subscribe({
    afterCreate: sync,
    afterUpdate: sync,

    // A delete is either the whole entry going, or just its published row on unpublish. Only
    // the first should drop the record, so the document is looked up again before deciding.
    async afterDelete(event: any) {
      const uid = event.model?.uid;
      if (uid === POST_UID) return;

      const documentId = event.result?.documentId;
      const stillThere = await strapi.documents(uid as any).findOne({ documentId });

      if (stillThere) {
        await onEntryChanged(strapi, uid, stillThere);
      } else {
        await onEntryRemoved(strapi, uid, documentId);
      }
    },
  });
};

export default register;

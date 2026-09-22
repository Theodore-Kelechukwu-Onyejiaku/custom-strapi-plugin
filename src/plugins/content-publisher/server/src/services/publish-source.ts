// services/publish-source.ts
//
// Works out what a tracking record actually points at, and how that entry's attributes map
// onto a platform's fields. Split out of publish.ts because it is the part that had to stop
// assuming every record is a blog.

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

import type { Platform, Settings } from '../platforms';
import { BLOG_UID, ENTRY_POPULATE, LEGACY_MAPS } from './publish-config';

const { ApplicationError } = errors;

export const resolveSource = async (
  strapi: Core.Strapi,
  post: any,
  platform: Platform,
  settings: Settings
) => {
  // the tracking record carries the uid and documentId of whatever it tracks
  const uid = post?.contentType;
  const entryId = post?.entryId;

  if (!uid || !entryId) {
    throw new ApplicationError('This record is not linked to an entry.');
  }

  const entry = await strapi.documents(uid).findOne({
    documentId: entryId,
    populate: ENTRY_POPULATE,
  });

  if (!entry) {
    throw new ApplicationError('The entry this record points at no longer exists.');
  }

  // Blogs fall back to the pre-settings field names so an upgrade keeps working untouched.
  // Any other content type has no such history, so an unmapped one is told rather than
  // quietly publishing a post with every field empty.
  const saved = settings.platforms?.[platform.key]?.[uid];
  const fieldMap = saved ?? (uid === BLOG_UID ? LEGACY_MAPS[platform.key] : undefined);

  if (!fieldMap) {
    throw new ApplicationError(
      `No ${platform.label} field mapping saved for ${uid}. Add one in the publishing settings.`
    );
  }

  return { uid, entry, fieldMap };
};

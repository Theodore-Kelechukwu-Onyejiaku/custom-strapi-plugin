// services/publish-source.ts
//
// Works out what a tracking record actually points at, and how that entry's attributes map
// onto a platform's fields. Split out of publish.ts because it is the part that had to stop
// assuming every record is a blog.

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

import type { Platform, Settings } from '../platforms';
import { BLOG_UID, ENTRY_POPULATE, LEGACY_MAPS } from './publish-config';
import { publishedVersion } from './tracking';

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

  // The live (published) version, never the draft: the Document Service returns the draft by
  // default, which would send unpublished edits to the platform.
  const entry = await publishedVersion(strapi, uid, entryId, ENTRY_POPULATE);

  if (!entry) {
    throw new ApplicationError('This entry is not published. Publish it in Strapi first.');
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

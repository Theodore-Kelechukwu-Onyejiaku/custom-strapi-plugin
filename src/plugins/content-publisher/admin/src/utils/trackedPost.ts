// utils/trackedPost.ts
//
// The tracking record for one entry, as the posts routes return it. The link fields
// (devToLink, mediumLink …) hold the published URLs; read them with linkOf().

import type { PlatformTarget } from '../components/platformTargets';

// `entryPublished` is false while the entry is a draft, which cannot be published anywhere.
export type TrackedPost = {
  documentId: string;
  title?: string;
  entryPublished?: boolean;
  [field: string]: unknown;
};

// The URL a post was published at on this platform, or null when it is not there yet.
export const linkOf = (post: TrackedPost, target: PlatformTarget) => {
  const value = post[target.linkField];
  return typeof value === 'string' && value !== '' ? value : null;
};

// services/public-post.ts
//
// What may be shown about a tracked post outside the admin panel: the entry it belongs to
// and where it was published. Those URLs are already public on each platform. Internal
// fields (timestamps, draft state, the tracking record's own id) are left out.
//
// Shared by the public content API and the MCP list tool, so both show the same shape.

import { LINK_FIELDS } from './publish-config';

export type PublicPost = {
  title: string;
  contentType: string;
  entryId: string;
  // platform key -> URL, or null when not published there yet
  published: Record<string, string | null>;
};

export const toPublicPost = (post: any): PublicPost => ({
  title: post.title ?? '',
  contentType: post.contentType ?? '',
  entryId: post.entryId ?? '',
  published: Object.fromEntries(
    Object.entries(LINK_FIELDS).map(([platform, field]) => [platform, post[field] || null])
  ),
});

// Drafts are never public, the same rule getPosts applies to the table.
export const isPublic = (post: any) => Boolean(post?.entryPublished);

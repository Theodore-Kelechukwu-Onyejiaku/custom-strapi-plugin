// services/post-queries.ts
//
// The tracking table's reads and its delete. Everything comes off the tracking row itself —
// the title and date are snapshots kept fresh by the lifecycles in register.ts — so listing
// and searching stay one query no matter how many content types are configured.

import type { Core } from '@strapi/strapi';

import { POST_UID } from './publish-config';
import { buildListQuery } from './list-query';

// Sorting, filtering, search and paging all arrive as the standard admin query params, so
// the table gets them from Strapi's own components rather than anything hand-rolled.
export const getPosts = async (strapi: Core.Strapi, query: any) => {
  const { page, pageSize, start, sort, filters } = buildListQuery(query);

  const total = await strapi.documents(POST_UID).count({ filters });
  const posts = await strapi.documents(POST_UID).findMany({ filters, sort, start, limit: pageSize });

  return {
    posts,
    pagination: { page, pageSize, total, pageCount: Math.max(1, Math.ceil(total / pageSize)) },
  };
};

// Looked up by the entry it tracks, so the content-manager panel works for any configured
// collection type rather than only blogs.
export const getSinglePost = async (strapi: Core.Strapi, query: any) => {
  // without both, `$eq: undefined` would match any record and return a random post
  if (!query?.contentType || !query?.entryId) return null;

  return strapi.documents(POST_UID).findFirst({
    filters: {
      contentType: { $eq: String(query.contentType) },
      entryId: { $eq: String(query.entryId) },
    },
  });
};

export const deletePost = async (strapi: Core.Strapi, query: { postId: string }) => {
  await strapi.documents(POST_UID).delete({ documentId: query?.postId });
  return 'Post deleted';
};

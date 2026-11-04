// controllers/posts.ts
//
// The public content API (/api/content-publisher/posts…). It calls the same posts service
// as the admin routes and the MCP tools; this layer only trims each post to its public
// fields. Nobody can call these until an admin ticks them under
// Settings → Users & Permissions (or on an API token).

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

import { isPublic, toPublicPost } from '../services/public-post';

const { NotFoundError } = errors;

const service = (strapi: Core.Strapi) => strapi.plugin('content-publisher').service('service');

const posts = ({ strapi }: { strapi: Core.Strapi }) => ({
  // GET /api/content-publisher/posts?_q=…&page=…&pageSize=…
  // Published entries only; paging is capped at 100 per page by list-query.ts.
  async find(ctx) {
    const { posts: rows, pagination } = await service(strapi).getPosts(ctx.query);
    ctx.body = { data: rows.map(toPublicPost), meta: { pagination } };
  },

  // GET /api/content-publisher/posts/by-entry?contentType=api::blog.blog&entryId=<documentId>
  async findByEntry(ctx) {
    const post = await service(strapi).getSinglePost(ctx.query);
    if (!isPublic(post)) {
      throw new NotFoundError('No published entry with that contentType and entryId.');
    }
    ctx.body = { data: toPublicPost(post) };
  },
});

export default posts;

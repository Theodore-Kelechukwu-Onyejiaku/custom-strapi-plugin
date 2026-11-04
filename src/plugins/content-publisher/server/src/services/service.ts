// services/service.ts
//
// The plugin's posts service. Controllers, MCP tools and the chat all call these methods
// (strapi.plugin('content-publisher').service('service')) rather than querying or
// publishing themselves, so each rule lives in exactly one place.
//
// Thin wiring: the reads live in post-queries.ts, publishing in publish-post.ts.

import type { Core } from '@strapi/strapi';

import * as queries from './post-queries';
import { publishPost } from './publish-post';

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  // the publishing table, and the MCP list tool (search + limit only)
  async getPosts(query: any) {
    return queries.getPosts(strapi, query);
  },

  async getSinglePost(query: any) {
    return queries.getSinglePost(strapi, query);
  },

  async deletePost(query: { postId: string }) {
    return queries.deletePost(strapi, query);
  },

  // one method for every platform; platformKey is devTo, medium, bluesky, linkedIn or facebook
  async publish(platformKey: string, postId: string) {
    return publishPost(strapi, platformKey, postId);
  },
});

export default service;

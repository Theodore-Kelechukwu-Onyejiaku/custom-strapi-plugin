// services/service.ts
//
// Thin wiring. The reads live in post-queries.ts, the shared publishing path in
// publish.ts, and each platform's request in publishers/.

import type { Core } from '@strapi/strapi';

import * as queries from './post-queries';
import { publishEntry } from './publish';
import { sendToDevTo } from './publishers/devto';
import { sendToMedium } from './publishers/medium';
import { sendToBluesky } from './publishers/bluesky';

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  async getPosts(query: any) {
    return queries.getPosts(strapi, query);
  },

  async getSinglePost(query: any) {
    return queries.getSinglePost(strapi, query);
  },

  async getSearchQuery(query: { search: string; start: number }) {
    return queries.getSearchQuery(strapi, query);
  },

  async deletePost(query: { postId: string }) {
    return queries.deletePost(strapi, query);
  },

  async publishPostToDevTo(post: any) {
    return publishEntry(strapi, post, 'devTo', 'devToLink', sendToDevTo);
  },

  async publishPostToMedium(post: any) {
    return publishEntry(strapi, post, 'medium', 'mediumLink', sendToMedium);
  },

  async publishPostToBluesky(post: any) {
    return publishEntry(strapi, post, 'bluesky', 'blueskyLink', sendToBluesky(strapi));
  },
});

export default service;

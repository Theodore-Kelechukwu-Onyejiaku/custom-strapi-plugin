// controllers/controller.ts
//
// The publishing table's HTTP layer. Each handler only reads the request and calls the
// posts service, the same service the MCP tools use.

import type { Core } from '@strapi/strapi';

const service = (strapi: Core.Strapi) => strapi.plugin('content-publisher').service('service');

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  // get posts
  async getPosts(ctx) {
    ctx.body = await service(strapi).getPosts(ctx.query);
  },

  // publish a post to one platform: POST /posts/:id/publish/:platform
  async publish(ctx) {
    const { id, platform } = ctx.params;
    ctx.body = await service(strapi).publish(platform, id);
  },

  // the tracking post for one entry: GET /posts/by-entry?contentType=…&entryId=…
  async getSinglePost(ctx) {
    ctx.body = await service(strapi).getSinglePost(ctx.request.query);
  },

  // delete a post: DELETE /posts/:id
  async deletePost(ctx) {
    ctx.body = await service(strapi).deletePost({ postId: ctx.params.id });
  },
});

export default controller;

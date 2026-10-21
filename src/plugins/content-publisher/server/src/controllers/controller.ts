import type { Core } from '@strapi/strapi';

const service = (strapi: Core.Strapi) => strapi.plugin('content-publisher').service('service');

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  // get posts
  async getPosts(ctx) {
    ctx.body = await service(strapi).getPosts(ctx.query);
  },

  // publish a blog post to dev.to
  async publishPostToDevTo(ctx) {
    ctx.body = await service(strapi).publishPostToDevTo(ctx.request.body);
  },

  // publish a blog post to medium
  async publishPostToMedium(ctx) {
    ctx.body = await service(strapi).publishPostToMedium(ctx.request.body);
  },

  // publish a blog post to bluesky
  async publishPostToBluesky(ctx) {
    ctx.body = await service(strapi).publishPostToBluesky(ctx.request.body);
  },

  // publish a blog post to linkedin
  async publishPostToLinkedIn(ctx) {
    ctx.body = await service(strapi).publishPostToLinkedIn(ctx.request.body);
  },

  // publish a blog post to a facebook page
  async publishPostToFacebook(ctx) {
    ctx.body = await service(strapi).publishPostToFacebook(ctx.request.body);
  },

  // get a single post
  async getSinglePost(ctx) {
    ctx.body = await service(strapi).getSinglePost(ctx.request.query);
  },

  // search for a post
  async getSearchQuery(ctx) {
    ctx.body = await service(strapi).getSearchQuery(ctx.request.query);
  },

  // delete a post
  async deletePost(ctx) {
    ctx.body = await service(strapi).deletePost(ctx.request.query);
  },
});

export default controller;

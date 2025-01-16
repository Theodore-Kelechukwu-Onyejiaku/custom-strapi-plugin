import type { Core } from '@strapi/strapi';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  // get blog entries
  async getBlogs(ctx) {},

  // get posts
  async getPosts(ctx) {
    ctx.body = await strapi.plugin('content-publisher').service('service').getPosts();
  },

  // publish a blog post to dev.to
  async publishPostToDevTo(ctx) {
    ctx.body = await strapi
      .plugin('content-publisher')
      .service('service')
      .publishPostToDevTo(ctx.request.body);
  },

  // publish a blog post to medium
  async publishPostToMedium(ctx) {
    ctx.body = await strapi
      .plugin('content-publisher')
      .service('service')
      .publishPostToMedium(ctx.request.body);
  },

  // search for a post
  async getSearchQuery(ctx) {},

  // delete a post
  async deletePost(ctx) {},

  // get a single post
  async getSinglePost(ctx) {},
});

export default controller;

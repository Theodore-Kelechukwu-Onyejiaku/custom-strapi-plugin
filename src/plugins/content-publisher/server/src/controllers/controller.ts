import type { Core } from '@strapi/strapi';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  // get blog entries
  async getBlogs(ctx) {},

  // get posts
  async getPosts(ctx) {
    ctx.body = await strapi.plugin('content-publisher').service('service').getPosts();
  },

  // publish a blog post to medium
  async publishPostToMedium(ctx) {},

  // publish a blog post to dev.to
  async publishPostToDevTo(ctx) {},

  // search for a post
  async getSearchQuery(ctx) {},

  // delete a post
  async deletePost(ctx) {},

  // get a single post
  async getSinglePost(ctx) {},
});

export default controller;

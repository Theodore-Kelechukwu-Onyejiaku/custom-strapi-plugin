import type { Core } from '@strapi/strapi';

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * GET Posts with Pagination
   */
  async getPosts() {
    try {
      const posts = await strapi.documents('plugin::content-publisher.post').findMany({
        populate: {
          blog: {
            populate: ['tags'],
          },
        },
      });

      return posts;
    } catch (error) {
      throw error;
    }
  },
});

export default service;

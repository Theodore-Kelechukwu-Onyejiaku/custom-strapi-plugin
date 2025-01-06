import type { Core } from '@strapi/strapi';

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  strapi.db.lifecycles.subscribe({
    // only for the blog collection type
    models: ['api::blog.blog'],
    // after a blog post is created
    async afterCreate(event) {
      // create new data
      const newData = {
        blog: event.result.documentId,
        mediumLink: null,
        devToLink: null,
      };

      // create new post
      await strapi.documents('plugin::content-publisher.post').create({
        data: newData,
      });
    },
  });
};

export default register;

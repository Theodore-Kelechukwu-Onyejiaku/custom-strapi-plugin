import type { Core } from '@strapi/strapi';
import axios from 'axios';

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
  /**
   * Publish Post to Dev.to
   */
  async publishPostToDevTo(post: any) {
    try {
      // destructuring the post object
      const { title, content, canonicalUrl, tags, banner } = post.blog;
      // get the blog tags
      const blogTags = tags.map((tag) => tag.blogTag);

      // payload to be sent to dev.to
      const devToPayload = {
        article: {
          title,
          body_markdown: content,
          published: true,
          series: null,
          main_image: banner,
          canonical_url: canonicalUrl,
          description: content.length > 140 ? `${content.slice(0, 140)}...` : content,
          tags: blogTags,
          organization_id: null,
        },
      };

      // post
      const response = await axios.post(`https://dev.to/api/articles`, devToPayload, {
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.DEVTO_API_KEY,
        },
      });

      // get the dev.to url
      const devToUrl = response.data?.url;

      // update the post with the dev.to link
      await strapi.documents('plugin::content-publisher.post').update({
        documentId: post.documentId,
        data: {
          devToLink: devToUrl,
        } as any,
      });

      // return the response
      return response.data;
    } catch (error) {
      console.log(error.response.data);
      throw error;
    }
  },
});

export default service;

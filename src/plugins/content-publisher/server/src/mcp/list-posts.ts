// mcp/list-posts.ts
//
// The rows of the publishing table: each tracked entry and where it has been published.
// Reads through the same getPosts the table uses, so search and "published entries only"
// behave identically in both.

import { ai } from '@strapi/strapi';
import { z } from '@strapi/utils';

import { TOOL_LIST_POSTS } from '../permissions';
import { toPublicPost } from '../services/public-post';
import { authFor, ok, pluginService } from './shared';

// the public shape (same as the content API) plus the id publish_post needs
const row = (post: any) => ({ postId: post.documentId as string, ...toPublicPost(post) });

export default ai.mcp.defineTool({
  name: 'content_publisher_list_posts',
  title: 'List publishable posts',
  description:
    'Lists entries in the Content Publisher table with the URL each platform published them at (null = not published there yet). Use the postId with content_publisher_publish_post.',
  auth: authFor(TOOL_LIST_POSTS),
  resolveInputSchema: () =>
    z.object({
      search: z.string().optional().describe('Only titles containing this text'),
      limit: z.number().int().min(1).max(50).optional().describe('Default 20'),
    }),
  resolveOutputSchema: () =>
    z.object({
      posts: z.array(
        z.object({
          postId: z.string(),
          title: z.string(),
          contentType: z.string(),
          entryId: z.string(),
          published: z.record(z.string(), z.string().nullable()),
        })
      ),
    }),
  createHandler:
    (strapi) =>
    async ({ args }) => {
      // the table's own query params: _q is its search box, pageSize its page length
      const { posts } = await pluginService(strapi, 'service').getPosts({
        _q: args.search,
        pageSize: args.limit ?? 20,
      });

      const rows = posts.map(row);
      return ok(`${rows.length} post(s).`, { posts: rows });
    },
});

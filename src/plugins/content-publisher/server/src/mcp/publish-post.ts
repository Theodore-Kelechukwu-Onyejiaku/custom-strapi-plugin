// mcp/publish-post.ts
//
// Publishes one tracked entry to one platform by calling the posts service's publish(),
// the same method the publishing table's route calls. Every check (unknown post, already
// published, platform off, missing keys) lives there. The chat asks the editor to approve
// each call before it runs.

import { ai } from '@strapi/strapi';
import { z } from '@strapi/utils';

import { TOOL_PUBLISH_POST } from '../permissions';
import { PLATFORM_KEYS, authFor, failed, ok, pluginService } from './shared';

export default ai.mcp.defineTool({
  name: 'content_publisher_publish_post',
  title: 'Publish a post to a platform',
  description:
    'Publishes one post (by postId from content_publisher_list_posts) to one platform. This is public and cannot be undone, so only call it when the editor has asked for that exact post and platform.',
  auth: authFor(TOOL_PUBLISH_POST),
  resolveInputSchema: () =>
    z.object({
      postId: z.string().describe('postId from content_publisher_list_posts'),
      platform: z.enum(PLATFORM_KEYS).describe('Platform key'),
    }),
  resolveOutputSchema: () => z.object({ platform: z.string(), url: z.string() }),
  createHandler:
    (strapi) =>
    async ({ args }) => {
      try {
        const { url, title } = await pluginService(strapi, 'service').publish(
          args.platform,
          args.postId
        );
        return ok(`Published "${title}" to ${args.platform}: ${url}`, {
          platform: args.platform,
          url: String(url),
        });
      } catch (error: any) {
        // the service's error says what to fix: "already on Dev.to", "turned off" …
        return failed(error?.message ?? `Could not publish to ${args.platform}.`);
      }
    },
});

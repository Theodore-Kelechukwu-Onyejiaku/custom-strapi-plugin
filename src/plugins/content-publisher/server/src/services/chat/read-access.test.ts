// services/chat/read-access.test.ts
//
// The chat only gets the tools the editor's role allows. Checks the tool naming matches
// Strapi's own, and that each kind of tool follows the right permission.

import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { chatAccess, isAllowed, toolSlug } from './read-access';
import { PUBLISH, TOOL_LIST_POSTS, TOOL_PUBLISH_POST } from '../../permissions';

// Strapi's own tool naming. The file isn't in the package's exports, so it's loaded by path.
const require = createRequire(__filename);
const contentManager = path.dirname(require.resolve('@strapi/content-manager/package.json'));
const { slugifyUidForMcpToolName } = require(path.join(contentManager, 'dist/server/mcp/utils.js'));

const strapi: any = {
  contentTypes: { 'api::blog.blog': {}, 'api::tutorial.tutorial': {}, 'api::tag.tag': {} },
};

// a role that can read blogs and tags (not tutorials), list posts, and nothing else
const editor = {
  can: (action: string, subject?: string) =>
    (action === 'plugin::content-manager.explorer.read' && subject !== 'api::tutorial.tutorial') ||
    action === TOOL_LIST_POSTS,
};

describe('toolSlug', () => {
  it('matches the names Strapi gives its MCP tools', () => {
    const uids = ['api::blog.blog', 'api::blog.post', 'plugin::users-permissions.user'];
    uids.forEach((uid) => expect(toolSlug(uid)).toBe(slugifyUidForMcpToolName(uid)));
  });
});

describe('isAllowed', () => {
  const access = chatAccess(strapi, editor);

  it('keeps read tools only for types the role can read', () => {
    expect(isAllowed('list_blog', access)).toBe(true);
    expect(isAllowed('get_tag', access)).toBe(true);
    expect(isAllowed('list_tutorial', access)).toBe(false);
  });

  it('never keeps write tools', () => {
    expect(isAllowed('update_blog', access)).toBe(false);
    expect(isAllowed('delete_blog', access)).toBe(false);
  });

  it('keeps plugin tools only when the role has their AI tools permission', () => {
    expect(isAllowed('content_publisher_list_posts', access)).toBe(true);
    expect(isAllowed('content_publisher_list_platforms', access)).toBe(false);
  });

  it('needs both publish permissions for the publish tool', () => {
    const onlyTool = chatAccess(strapi, { can: (a: string) => a === TOOL_PUBLISH_POST });
    const both = chatAccess(strapi, { can: (a: string) => a === TOOL_PUBLISH_POST || a === PUBLISH });
    expect(isAllowed('content_publisher_publish_post', onlyTool)).toBe(false);
    expect(isAllowed('content_publisher_publish_post', both)).toBe(true);
  });
});

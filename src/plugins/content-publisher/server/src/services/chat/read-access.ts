// services/chat/read-access.ts
//
// The chat reaches Strapi's MCP server with one shared admin token, so on its own it could
// use every tool that token can. This works out what the editor's own role allows, so the
// chat only gets the tools the Super Admin gave that role.

import type { Core } from '@strapi/strapi';

import { PUBLISH, TOOL_LIST_PLATFORMS, TOOL_LIST_POSTS, TOOL_PUBLISH_POST } from '../../permissions';

const CONTENT_MANAGER_READ = 'plugin::content-manager.explorer.read';
const PUBLISH_TOOL = 'content_publisher_publish_post';

// each plugin tool's own permission, under Plugins → Content Publisher → AI tools
const PLUGIN_TOOLS: Record<string, string> = {
  content_publisher_list_posts: TOOL_LIST_POSTS,
  content_publisher_list_platforms: TOOL_LIST_PLATFORMS,
  [PUBLISH_TOOL]: TOOL_PUBLISH_POST,
};

export type ChatAccess = {
  canPublish: boolean;
  // tool slugs of the content types the role can read, e.g. "blog" for list_blog
  readable: string[];
  // the plugin's own tools the role was given
  pluginTools: string[];
};

// Strapi's own naming for its MCP tools: api::blog.blog → "blog",
// plugin::users-permissions.user → "plugin-users-permissions_user"
export const toolSlug = (uid: string) => {
  const [namespace, name] = uid.split('::');
  const parts = name.split('.').map((part) => part.toLowerCase());
  if (namespace === 'api') return parts[0] === parts[1] ? parts[0] : parts.join('_');
  return `${namespace.toLowerCase()}-${parts.join('_')}`;
};

// Read-only Content Manager tools (list_blog, get_tag …) for the types the role can read,
// plus the plugin tools the role was given. Writes such as update_* or delete_* are always
// left out, and so are user accounts, so the chat only ever changes something through the
// approved publish tool.
export const isAllowed = (name: string, access: ChatAccess) => {
  if (name === PUBLISH_TOOL) return access.canPublish && access.pluginTools.includes(name);
  if (name in PLUGIN_TOOLS) return access.pluginTools.includes(name);
  // "list_blog" → "blog"
  const slug = name.match(/^(list|get)_(.+)$/)?.[2];
  return Boolean(slug) && !name.includes('users-permissions') && access.readable.includes(slug);
};

export const chatAccess = (strapi: Core.Strapi, userAbility: any): ChatAccess => {
  const can = (action: string, subject?: string) => Boolean(userAbility?.can(action, subject));

  return {
    canPublish: can(PUBLISH),
    readable: Object.keys(strapi.contentTypes)
      .filter((uid) => can(CONTENT_MANAGER_READ, uid))
      .map(toolSlug),
    pluginTools: Object.keys(PLUGIN_TOOLS).filter((name) => can(PLUGIN_TOOLS[name])),
  };
};

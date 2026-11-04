// permissions.ts
//
// The plugin's RBAC actions, registered in bootstrap.ts and checked by the routes, the MCP
// tools and the chat. Each becomes a checkbox under Settings → Roles (and Admin Tokens) →
// Plugins → Content Publisher.
//
// Least privilege: seeing the table, publishing (public and permanent) and deleting are
// separate, and so are seeing and changing the settings, which describe where content goes
// and which credentials exist.
//
// Dashes, not dots. useRBAC names its allowedActions from the *last dot-segment* of the
// action, split on dashes — so `settings.update` would arrive as `canUpdate` and
// `settings.read` would collide with `read` as `canRead`. `settings-update` gives the
// `canSettingsUpdate` the admin panel actually checks. Strapi also rejects underscores.

const action = (uid: string, displayName: string, subCategory?: string) => ({
  section: 'plugins',
  pluginName: 'content-publisher',
  uid,
  displayName,
  ...(subCategory ? { subCategory } : {}),
});

export const ACTIONS = [
  action('read', 'Access the publishing table'),
  action('publish', 'Publish posts to platforms'),
  action('delete', 'Delete posts from the publishing table'),
  action('settings-read', 'Access the publishing settings'),
  action('settings-update', 'Change the publishing settings'),

  // one per MCP tool, so each tool can be granted to an admin token on its own
  action('tool.list-posts', 'List posts', 'AI tools'),
  action('tool.list-platforms', 'List platforms', 'AI tools'),
  action('tool.publish-post', 'Publish a post', 'AI tools'),
];

const id = (uid: string) => `plugin::content-publisher.${uid}`;

export const READ = id('read');
export const PUBLISH = id('publish');
export const DELETE = id('delete');
export const SETTINGS_READ = id('settings-read');
export const SETTINGS_UPDATE = id('settings-update');

export const TOOL_LIST_POSTS = id('tool.list-posts');
export const TOOL_LIST_PLATFORMS = id('tool.list-platforms');
export const TOOL_PUBLISH_POST = id('tool.publish-post');

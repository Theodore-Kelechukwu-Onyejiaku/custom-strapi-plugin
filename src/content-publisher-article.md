---
title: "Building a Strapi 5 Plugin That Cross-Posts Content, with MCP Tools and an AI Assistant"
description: "A walkthrough of Content Publisher, a Strapi 5 plugin that publishes entries to Dev.to, Medium, Bluesky, LinkedIn and Facebook, tracks where each one went, and exposes its publishing logic to AI clients through Strapi's MCP server."
author: Theodore Kelechukwu Onyejiaku
tags: [Strapi 5, Plugins, MCP, AI]
---

## Introduction

When I publish an article in Strapi, the work isn't done. The same piece usually goes to Dev.to, Medium, Bluesky, LinkedIn and Facebook, and each one has its own editor, its own fields and its own idea of what a cover image is.

Content Publisher is the Strapi 5 plugin I built to handle that from the admin panel. Editors pick a published entry, choose a platform, and the plugin sends it and stores the URL that comes back. It also adds three tools to Strapi's built-in MCP server, so an AI client, including a chat inside the plugin, can publish too. It follows the same rules and permissions as the Publish button.

This walkthrough covers how the pieces fit together and the implementation choices that matter if you're building something similar. The source is on [GitHub](https://github.com/Theodore-Kelechukwu-Onyejiaku/custom-strapi-plugin). Paths below are relative to `src/plugins/content-publisher/`.

![The Content Publisher table in the Strapi admin, with the publishing assistant open](./images/hero.png)

## TL;DR

- A hidden `post` content type keeps one tracking record per entry, kept in sync by database lifecycles.
- All publishing logic lives in one service. The admin table, the Content Manager panel, the MCP tools and the chat all call it.
- Each platform is described as data (its API fields and env vars), so one route and one MCP tool cover all five.
- Admin routes check RBAC permissions, and each MCP tool has its own permission you grant on admin tokens.
- The AI chat runs on the Vercel AI SDK, gets only the tools the editor is allowed to use, and waits for the editor's approval before publishing.

## Prerequisites

- Strapi 5. The plugin is built and tested on 5.60 and declares `^5.54.0` as its peer range.
- Node.js 20 or 22.
- Familiarity with Strapi plugin structure: the `server/` and `admin/` folders, services, controllers and routes.
- API keys for the platforms you want to publish to.
- An Anthropic API key, if you want the AI chat.

## Business Problem

### 1. Cross-Posting by Hand to Five Platforms

Copying an article into five editors is slow, and each platform wants different things. Dev.to takes Markdown in `body_markdown`. Bluesky caps a post at 300 graphemes. LinkedIn and Facebook need an OAuth sign-in before they'll accept anything. Doing this by hand every time is where mistakes creep in.

### 2. No Record of Where Each Post Went

Once something is cross-posted, the answer to "where is this already published?" lives in someone's head. Strapi has no field for it, and adding one to every content type would mix plugin data into the project's own schema.

### 3. AI Clients Only Get CRUD Tools

Strapi 5's [MCP server](https://docs.strapi.io/cms/features/strapi-mcp-server) generates tools such as `list_blog` and `update_blog` from your content types. They know your fields, not your rules. An AI client working with them can't tell a draft from a published entry, and has no way to publish to Dev.to at all. If AI is going to publish, it needs tools that run the same logic as the admin UI.

## How It Works: Architecture

![Every way into the plugin ends at the same publish path](./images/diagram-architecture.png)

### 1. Publishing Table

The plugin's main page lists every tracked entry and shows which platforms it has reached. Editors search, filter, and publish one entry to one platform or to all the remaining ones.

### 2. Content Manager Publish Panel

A **Publish to** panel in the Content Manager's edit view lets editors publish without leaving the entry.

### 3. Settings Page

Admins choose which collection types are publishable, map each platform's fields to their own attributes, turn platforms on or off, test credentials, and connect LinkedIn and Facebook.

### 4. AI Chat and MCP Tools

Three MCP tools, `content_publisher_list_posts`, `content_publisher_list_platforms` and `content_publisher_publish_post`, are available to any MCP client. A chat on the plugin's pages uses them, and asks the editor to approve every publish.

### 5. Public API

Two read-only content API routes return published entries and their platform URLs, so a frontend can show "Also on Dev.to" under a post.

Behind all five, the server has one service layer. None of these surfaces talks to the database directly.

## How I Solved It

### Setting Up: Scaffolding the Plugin and Connecting the Strapi Docs MCP Server

From the root of a Strapi project, the [Plugin SDK](https://docs.strapi.io/cms/plugins-development/create-a-plugin) creates the plugin under `src/plugins/`:

```bash
npx @strapi/sdk-plugin init content-publisher
```

Then enable it in `config/plugins.ts`:

```ts
// config/plugins.ts
export default {
  'content-publisher': {
    enabled: true,
    resolve: './src/plugins/content-publisher',
  },
};
```

Strapi loads a local plugin from its built `dist` folder, so keep `npm run watch` running in the plugin directory. I hit this one: newly added public routes returned 404 because `dist` was stale.

While building, I kept Strapi's [Docs MCP server](https://docs.strapi.io/cms/ai/docs-mcp-server) connected to my coding assistant. Assistants have seen far more Strapi 4 code than Strapi 5 code, and the docs server answers from current documentation. In Claude Code:

```bash
claude mcp add --transport http strapi-docs https://strapi-docs.mcp.kapa.ai
```

### Creating the Plugin Content Type

The tracking records live in a content type the plugin owns. `pluginOptions` keeps it out of the Content Manager and the Content-Type Builder, because editors see these records in the publishing table instead:

```ts
// server/src/content-types/post.ts (trimmed)
const schema = {
  kind: 'collectionType',
  collectionName: 'posts',
  info: { singularName: 'post', pluralName: 'posts', displayName: 'Post' },
  options: { draftAndPublish: false },
  pluginOptions: {
    'content-manager': { visible: false },
    'content-type-builder': { visible: false },
  },
  attributes: {
    contentType: { type: 'string' },  // the tracked entry's uid, e.g. "api::blog.blog"
    entryId: { type: 'string' },      // its documentId
    title: { type: 'string' },        // a copy, so the table can search in one query
    entryPublished: { type: 'boolean', default: false },
    devToLink: { type: 'text' },      // one URL field per platform
    mediumLink: { type: 'text' },
    // … blueskyLink, linkedInLink, facebookLink
  },
};

export default { schema };
```

Exporting it as `post` from `server/src/content-types/index.ts` gives it the uid `plugin::content-publisher.post`.

### Keeping Records in Sync with Lifecycles

A tracking record has to follow its entry. The plugin subscribes to database lifecycles in the server `register()`:

```ts
// server/src/register.ts (trimmed)
const isTracked = async (uid) => {
  if (uid === POST_UID) return false; // the plugin's own writes would trigger this again
  const { contentTypes } = await getSettings(strapi);
  return contentTypes.includes(uid);
};

const sync = async (event) => {
  const uid = event.model?.uid;
  if (await isTracked(uid)) await onEntryChanged(strapi, uid, event.result);
};

strapi.db.lifecycles.subscribe({
  afterCreate: sync,
  afterUpdate: sync,
  async afterDelete(event) {
    const uid = event.model?.uid;
    if (uid === POST_UID) return;
    const documentId = event.result?.documentId;
    // unpublishing deletes the published row but keeps the draft, so check first
    const stillThere = await strapi.documents(uid).findOne({ documentId });
    if (stillThere) await onEntryChanged(strapi, uid, stillThere);
    else await onEntryRemoved(strapi, uid, documentId);
  },
});
```

The subscription has no `models` filter, because admins can change the tracked types at any time. Instead, each event is checked against the current settings.

The `afterDelete` handler is the one that surprises people. With Draft & Publish, unpublishing an entry deletes its published row, so a delete event doesn't always mean the entry is gone.

Lifecycles only see changes that happen after a type is selected. `syncTrackingRecords()` in `services/backfill.ts` covers entries that already existed. It runs in `bootstrap()` and again whenever the selection changes, and running it twice changes nothing.

### Adding the Business Logic in Services

Four places publish: the table, the edit view panel, the MCP tool and the chat. If each had its own database code, each would carry its own copy of the rules. So publishing is one method on one service:

```ts
// server/src/services/service.ts (trimmed)
const service = ({ strapi }) => ({
  async getPosts(query) {
    return queries.getPosts(strapi, query);
  },

  // one method for every platform: devTo, medium, bluesky, linkedIn or facebook
  async publish(platformKey: string, postId: string) {
    return publishPost(strapi, platformKey, postId);
  },
});
```

`publishPost` loads the post by id, then checks the rules before sending anything:

```ts
// server/src/services/publish-post.ts (trimmed)
const post = await strapi.documents(POST_UID).findOne({ documentId: postId });
if (!post) throw new NotFoundError(`No post with id ${postId}.`);

if (!post.entryPublished) {
  throw new ApplicationError(`"${post.title}" is a draft. Publish it in Strapi first.`);
}
if (post[LINK_FIELDS[platformKey]]) {
  throw new ApplicationError(`"${post.title}" is already on that platform.`);
}

// is the platform on, load credentials, read the entry, send it, save the URL
const { url } = await publishEntry(strapi, post, platformKey, senders(strapi)[platformKey]);
return { url, title: post.title };
```

This layout paid off. An audit found that publishing could send draft content, and that it trusted the post sent in the request body. Both were fixed once, here, and every caller got the fix.

`publishEntry` in `services/publish.ts` is the part every platform shares. Each step can stop the publish with a message the editor can act on:

```ts
// server/src/services/publish.ts (trimmed)
export const publishEntry = async (strapi, post, platformKey, send) => {
  const platform = getPlatform(platformKey);
  const settings = await getSettings(strapi);

  // a missing flag means on; only an explicit false turns a platform off
  if (settings.enabled?.[platformKey] === false) {
    throw new ApplicationError(`${platform.label} is turned off in the publishing settings.`);
  }

  // an API key from .env, or for LinkedIn and Facebook the signed-in account's token
  const secrets = await secretsFor(strapi, settings, platform);

  // the published version of the entry, plus this content type's field mapping
  const { uid, entry, fieldMap } = await resolveSource(strapi, post, platform, settings);
  const url = await send(resolveFields(strapi, uid, platform, fieldMap, entry), secrets);

  await strapi.documents(POST_UID).update({
    documentId: post.documentId,
    data: { [LINK_FIELDS[platformKey]]: url },
  });

  return { url };
};
```

`resolveSource` reads the entry with `status: 'published'`, because Strapi 5's Document Service returns the draft by default. Without it, unsaved edits to a published entry would go out instead of the live version.

`resolveFields` is what lets one service handle five platforms. It walks the platform's field list and reads each value from whichever attribute the admin mapped it to:

```ts
// server/src/services/resolve-fields.ts (trimmed)
const readValue = (strapi, attributes, fieldMap, field, entry, name) => {
  const type = attributes?.[name]?.type;
  const raw = entry?.[name];

  if (type === 'media') return mediaUrl(raw, strapi); // relative uploads get the server URL
  if (type === 'relation') return relationValues(raw, fieldMap[`${field.key}__item`]);
  return raw ?? null;
};
```

The result is an object keyed by the platform's own field names, such as `{ title, body_markdown, main_image }` for Dev.to. Each sender function turns that into one API request and returns the post's URL. A sender never sees the project's attribute names.

### Adding RBAC Permissions

A plugin's permissions only show up in the admin panel once the plugin registers them. Content Publisher registers separate actions for viewing, publishing, deleting, reading settings and changing settings:

```ts
// server/src/permissions.ts (trimmed)
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
  // … plus one action per MCP tool, shown later
];
```

```ts
// server/src/bootstrap.ts (trimmed)
await strapi.service('admin::permission').actionProvider.registerMany(ACTIONS);
```

Strapi names each action `plugin::content-publisher.<uid>`. Use only lowercase letters, dots and dashes in a `uid`. Strapi rejects underscores, and a single invalid `uid` fails the whole `registerMany` call, so none of the checkboxes appear.

Keeping publish and delete separate from read means a role can see where everything is published without being able to post anything.

### Creating Admin Routes and Content API Routes

Admin routes go through a small helper that applies Strapi's two admin policies:

```ts
// server/src/routes/can.ts
export const middlewares = ['plugin::content-publisher.plugin-errors'];

// hasPermissions requires every listed action, so can(READ, PUBLISH) means both
export const can = (...actions: string[]) => ({
  policies: [
    'admin::isAuthenticatedAdmin',
    { name: 'admin::hasPermissions', config: { actions } },
  ],
  middlewares,
});
```

```ts
// server/src/routes/posts.ts (trimmed)
{ method: 'GET', path: '/posts', handler: 'controller.getPosts', config: can(READ) },
{
  method: 'POST',
  path: '/posts/:id/publish/:platform',
  handler: 'controller.publish',
  config: can(READ, PUBLISH),
},
{
  method: 'DELETE',
  path: '/posts/:id',
  handler: 'controller.deletePost',
  config: can(READ, DELETE),
},
```

The routes in this plugin were once set to `auth: false`, publish and delete included. If you start from a prototype, search for that before you ship.

`can()` also attaches the plugin's own `plugin-errors` middleware. Strapi's error handler recognizes its error classes with `instanceof`. This plugin resolves its own copy of `@strapi/utils`, so the classes it throws are different objects from the ones the host checks against. The check fails, and a message like "is a draft. Publish it in Strapi first." reached the client as a bare 500. Matching on `error.name` fixes that:

```ts
// server/src/middlewares/plugin-errors.ts (trimmed)
const STATUS_BY_NAME = { NotFoundError: 404, ForbiddenError: 403, PolicyError: 403 /* … */ };
const KNOWN = new Set(['ApplicationError', 'ValidationError', ...Object.keys(STATUS_BY_NAME)]);

export default (_config, { strapi }) => async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    const known = KNOWN.has(error?.name);
    const status = known ? (STATUS_BY_NAME[error.name] ?? 400) : 500;
    if (!known) strapi.log.error(error); // a real bug: logged, not echoed to the client

    ctx.status = status;
    ctx.body = {
      data: null,
      error: {
        status,
        name: known ? error.name : 'InternalServerError',
        message: known ? error.message : 'Internal Server Error',
        details: error?.details ?? {},
      },
    };
  }
};
```

The response keeps Strapi's own error shape, so the admin reads `err.response.data.error.message` the same way it would for a core error. The middleware is exported from `server/src/middlewares/index.ts` as `'plugin-errors'`, which is why routes reference it as `plugin::content-publisher.plugin-errors`.

The public routes are content API routes. They have no admin policies, because Users & Permissions controls them:

```ts
// server/src/routes/content-api.ts
const config = { policies: [], middlewares };

export default [
  { method: 'GET', path: '/posts', handler: 'posts.find', config },
  { method: 'GET', path: '/posts/by-entry', handler: 'posts.findByEntry', config },
];
```

Strapi turns each content API handler into a checkbox under *Settings → Users & Permissions → Roles → Content-publisher → Posts*. They return 403 until someone ticks them. The controller returns only titles and platform URLs, which are already public.

### Building the Publishing Page

The page is a Design System table. Its state lives in the URL: Strapi's `SearchInput`, `Filters`, sortable headers and `Pagination` all write query parameters, and the hook forwards them as they are:

```ts
// admin/src/hooks/usePostsQuery.ts (trimmed)
const { get } = useFetchClient();
const [{ rawQuery }] = useQueryParams();

const { data } = await get(`/content-publisher/posts${rawQuery}`);
```

`useFetchClient` sends the logged-in admin's JWT, which the `can(...)` policies check. Buttons follow the same permissions, through `useRBAC`:

```ts
// admin/src/hooks/usePostPermissions.ts (trimmed)
const { allowedActions, isLoading } = useRBAC({
  publish: pluginPermissions.publish,
  delete: pluginPermissions.delete,
});

return {
  canPublish: !isLoading && Boolean(allowedActions.canPublish),
  canDelete: !isLoading && Boolean(allowedActions.canDelete),
};
```

`useRBAC` names each result after the last dot-segment of the action. That's why the settings actions use dashes: `settings.read` would also become `canRead` and clash with `read`.

### Adding a Publish Panel to the Content Manager with an Injection Zone

The edit view offers an [injection zone](https://docs.strapi.io/cms/plugins-development/admin-injection-zones) called `right-links`, in its sidebar. The plugin injects its panel from the admin `bootstrap()`, because the Content Manager isn't available during `register()`:

```tsx
// admin/src/index.tsx (trimmed)
async bootstrap(app) {
  app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
    name: 'content-publisher',
    Component: EntryPublishPanel,
  });
},
```

The component renders on every content type's edit view, so it checks which entry is open:

```tsx
// admin/src/components/EntryPublishPanel.tsx (trimmed)
const { slug, id } = unstable_useContentManagerContext();
const { contentTypes, platforms } = usePublishTargets();
const enabled = Boolean(contentTypes?.includes(slug));

const { post, reload } = useEntryPost({ contentType: slug, entryId: id, enabled });
const { publishTo, busy } = usePublishRow(post, reload);
const { canPublish } = usePostPermissions();

if (!enabled) return null; // after the hooks, as React requires
```

It reuses the table's hooks, so it publishes through the same route with the same permission check. It also reads the entry's status with `unstable_useDocument`, so publishing the entry in Strapi updates the panel without a reload. The `unstable_` prefix means those hooks can change, so keep them in one component.

![The "Publish to" panel in a blog entry's edit view](./images/edit-view-panel.png)

### Building the Settings Page

Settings are configuration, not content, so they live in Strapi's core store instead of a content type:

```ts
// server/src/services/settings-store.ts (trimmed)
const store = (strapi) =>
  strapi.store({ type: 'plugin', name: 'content-publisher', key: 'settings' });
```

`getSettings()` fills in defaults, and `saveSettings()` merges a patch, so saving one section never overwrites another.

**1. Selecting Collection Types to Publish From**

`services/content-types.ts` lists the project's collection types with their attributes. It leaves out Strapi's internal types and the plugin's own, along with attributes such as `documentId` and `publishedAt`. Saving the selection (`PUT /settings/content-types`, guarded by `SETTINGS_UPDATE`) runs the backfill, so existing entries appear in the table straight away.

**2. Defining Platforms and Mapping Their Fields**

Each platform is a plain object:

```ts
// server/src/platforms/devto.ts (trimmed)
const devTo: Platform = {
  key: 'devTo',
  label: 'Dev.to',
  envVars: ['DEVTO_API_KEY'],
  fields: [
    { key: 'title', label: 'Title', required: true, accepts: ['string', 'text'] },
    {
      key: 'body_markdown',
      label: 'Content',
      required: true,
      accepts: ['string', 'text', 'richtext'],
    },
    { key: 'main_image', label: 'Cover image', required: false, accepts: ['media'] },
    // … canonical_url, tags, description
  ],
};
```

The settings page builds a dropdown for each field, filtered by `accepts`, so a cover image only offers media attributes. The admin maps `body_markdown` to whichever attribute holds their content. Relations get a second dropdown for the attribute on the related entry that holds the text, saved as `tags__item`.

`mapping-validator.ts` checks every attribute name before saving. Without it, a typo would save fine and only fail at publish time.

The same `PLATFORMS` list feeds the publish route's `:platform` parameter and the MCP tool's input schema. Adding a platform means one definition and one sender function.

**3. Storing Credentials and Connecting LinkedIn and Facebook with OAuth**

API keys live only in the project's `.env`. The settings page shows whether each one is set, but never its value. Add the ones for the platforms you use, then restart Strapi:

```bash
# .env
# Platforms that use an API key
DEVTO_API_KEY=
MEDIUM_USER_ID=
MEDIUM_API_TOKEN=
BLUESKY_IDENTIFIER=        # your handle, e.g. you.bsky.social
BLUESKY_APP_PASSWORD=      # an app password, not your account password

# Apps behind the LinkedIn and Facebook Connect buttons
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
ENCRYPTION_KEY=            # encrypts their sign-in tokens; new Strapi projects have one

# Optional: the AI chat
ANTHROPIC_API_KEY=
STRAPI_MCP_TOKEN=          # an admin token, covered in the MCP section below
ANTHROPIC_MODEL=           # defaults to claude-haiku-4-5
```

If your project has no `ENCRYPTION_KEY` yet, generate one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Paste the output into `.env`, then make sure `config/admin.ts` reads it. Recent Strapi 5 projects already include this:

```ts
// config/admin.ts
export default ({ env }) => ({
  // ...existing config
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY'),
  },
});
```

Keep the key safe and don't change it later. Tokens encrypted with the old key can't be read, so LinkedIn and Facebook would need to be connected again.

LinkedIn and Facebook use OAuth instead of a key. The admin clicks **Connect**, signs in at LinkedIn or Facebook in a popup, and the provider sends them back to the plugin's callback route. That's the only route with `auth: false`, because the provider's redirect carries no admin token:

```ts
// server/src/routes/connections.ts (trimmed)
{
  method: 'GET',
  path: '/connect/:platform/callback',
  handler: 'connection.callback',
  config: { auth: false, policies: [], middlewares },
},
```

To keep that open route safe, the plugin gives each sign-in a one-time `state` that expires after ten minutes, and only accepts callbacks that bring it back. The token it receives is encrypted with `admin::encryption` before it's saved.

To create the apps and get their id and secret, follow [LinkedIn's authorization code flow](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow) and [Facebook's manual login flow](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow). Add `http://localhost:1337/content-publisher/connect/linkedIn/callback` (or `facebook`) as the redirect URL.

### Enabling the Strapi MCP Server and Adding Custom Tools

Strapi's MCP server lets AI clients like Claude or Cursor work with your content. Out of the box it only offers basic tools for reading and editing entries, so the plugin adds its own: list posts, list platforms and publish a post.

It works in three parts: turning the MCP server on, defining a tool and registering the tools.

**1. Turning the MCP server on**

The MCP server is off unless you turn it on in `config/server.ts`. Setting `MCP_ENABLED=false` turns it off again in a given environment:

```ts
// config/server.ts (trimmed)
mcp: { enabled: env.bool('MCP_ENABLED', true) },
```

**2. Defining a tool**

Each tool has a description for the AI, a permission, the inputs it needs and the code that runs. The publish tool calls the same service as the table, so the same rules apply:

```ts
// server/src/mcp/publish-post.ts (trimmed)
export default ai.mcp.defineTool({
  name: 'content_publisher_publish_post',
  description: 'Publishes one post to one platform. This is public and cannot be undone.',
  auth: authFor(TOOL_PUBLISH_POST),
  resolveInputSchema: () => z.object({ postId: z.string(), platform: z.enum(PLATFORM_KEYS) }),
  createHandler: (strapi) => async ({ args }) => {
    try {
      const { url } = await pluginService(strapi, 'service').publish(args.platform, args.postId);
      return ok(`Published to ${args.platform}: ${url}`, { url });
    } catch (error) {
      return failed(error.message); // e.g. "this post is a draft"
    }
  },
});
```

The `description` is the only thing the AI reads to decide when to use the tool. Errors are returned, not thrown, so the AI can tell the editor what went wrong.

**3. Registering the tools**

The tools are registered from the plugin's `register()`, and skipped when MCP is off:

```ts
// server/src/mcp/index.ts (trimmed)
export const registerMcpTools = (strapi) => {
  const mcp = strapi.ai?.mcp;
  if (!mcp?.isEnabled?.()) return;
  TOOLS.forEach((tool) => mcp.registerTool(tool));
};
```

A plugin can register tools in its `register()` or `bootstrap()` ([docs](https://docs.strapi.io/cms/plugins-development/extend-mcp-server)). Your app's own `bootstrap()` is too late: it runs after the MCP server has started, and registering there throws an error.

### Registering Tool Permissions and Testing Them with an Admin Token

Each tool's `auth` points at its own action, added to the same `ACTIONS` list under an "AI tools" heading:

```ts
// server/src/permissions.ts (trimmed)
action('tool.list-posts', 'List posts', 'AI tools'),
action('tool.list-platforms', 'List platforms', 'AI tools'),
action('tool.publish-post', 'Publish a post', 'AI tools'),
```

The MCP server only accepts admin tokens, and a token only sees the tools it has permission for. A missing permission doesn't produce an error; the tool just isn't in the list. Create a token under *Settings → Administration Panel → Admin Tokens*, open **Plugins → Content Publisher**, and tick what the client needs under **AI tools**.

![Admin token permissions with the AI tools group](./images/admin-token.png)

Point a client at Strapi without committing the token:

```json
{
  "mcpServers": {
    "strapi": {
      "type": "http",
      "url": "http://localhost:1337/mcp",
      "headers": { "Authorization": "Bearer ${STRAPI_MCP_TOKEN}" }
    }
  }
}
```

You can also see exactly what a token gets without a client. The first request starts a session:

```bash
curl -si http://localhost:1337/mcp \
  -H "Authorization: Bearer $STRAPI_MCP_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{
       "protocolVersion":"2025-06-18","capabilities":{},
       "clientInfo":{"name":"curl","version":"1"}}}'
```

Copy the `mcp-session-id` response header, then ask for the tool list:

```bash
curl -s http://localhost:1337/mcp \
  -H "Authorization: Bearer $STRAPI_MCP_TOKEN" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```

Now untick "Publish a post" on the token and run the second request again. `content_publisher_publish_post` should be gone while the two list tools stay. If it's still there, the tool's `auth` doesn't point at the action you expect.

One warning about this design: renaming a permission `uid` is a breaking change. When the tools moved from a shared permission to one each, every existing token lost them until the new boxes were ticked.

### Adding the AI Chat with Approval Before Publishing

The chat lets editors ask in plain English what has been published where, and publish posts by asking. It's built with the Vercel AI SDK:

```bash
npm install ai @ai-sdk/anthropic @ai-sdk/mcp @ai-sdk/react
```

It works in three parts: it only gets the tools the editor's role allows, it asks before every publish, and the chat window shows that question as a card.

**1. Only the tools the editor's role allows**

The chat connects to Strapi's MCP server with one shared admin token, so the plugin checks the logged-in editor's role first and removes every tool that role isn't allowed to use:

```ts
// server/src/services/chat/read-access.ts (trimmed)
export const isAllowed = (name: string, access: ChatAccess) => {
  if (name === PUBLISH_TOOL) return access.canPublish && access.pluginTools.includes(name);
  if (name in PLUGIN_TOOLS) return access.pluginTools.includes(name);
  const slug = name.match(/^(list|get)_(.+)$/)?.[2]; // "list_blog" → "blog"
  return Boolean(slug) && access.readable.includes(slug);
};
```

For example, an editor who can read Blogs but not Tutorials gets `list_blog`, but not `list_tutorial`.

**2. Asking before every publish**

The agent pauses before calling the publish tool and waits for the editor's answer:

```ts
// server/src/services/chat/agent.ts (trimmed)
const agent = new ToolLoopAgent({
  model: anthropic(model),
  tools,
  toolApproval: { content_publisher_publish_post: 'user-approval' },
  // signs approval requests so the browser can't forge an "approved" answer
  experimental_toolApprovalSecret: String(strapi.config.get('admin.auth.secret')),
});
```

**3. The chat window**

In the admin, `useChat` sends each message to the plugin's `/chat` route with the editor's login token. When the AI wants to publish, the chat shows a card with two buttons:

```tsx
// admin/src/components/chat/ToolCall.tsx (trimmed)
<Typography>{`Publish to ${part.input?.platform}?`}</Typography>
<Button onClick={() => onRespond(part.approval.id, true)}>Publish</Button>
<Button onClick={() => onRespond(part.approval.id, false)}>Cancel</Button>
```

Clicking a button sends the answer back to the server, which publishes or stops.

![The chat asking "Publish to bluesky?" before it publishes](./images/chat-approval.png)

### Testing the App

The plugin has Vitest unit tests:

```bash
npm test
```

The current suite covers the chat's model allowlist: the default, the `ANTHROPIC_MODEL` override, and rejecting a model that isn't on the list. Before publishing the package, `npm run verify` checks `package.json` and the build exports, and `npm audit --omit=dev` checks the dependencies that ship.

The rest is worth checking by hand, because each check exercises a different permission path:

- **A restricted role.** Give a role only "Access the publishing table". It should see the table with no Publish menu or Delete button, and a direct `POST /content-publisher/posts/:id/publish/devTo` should get a 403.
- **A draft.** Drafts never appear in the table. Open one in the Content Manager, and the panel should say "Publish this entry first". Ask the chat to publish it, and the tool should come back with "Publish it in Strapi first."
- **Admin token scope.** Untick each AI tools permission and confirm its tool disappears.
- **The chat's approval.** Ask it to publish and check nothing goes out until you click **Publish**.
- **Images.** With local uploads, image URLs point at `localhost`, which Dev.to can't fetch. That's why a Dev.to post can end up without its cover image. Use an upload provider with public URLs before you publish images.

## Limitations

- **The chat follows the editor's role per content type, not per field.** Tools are filtered by the editor's role, but they still run with the shared `STRAPI_MCP_TOKEN`. If a role can read a content type but not one of its fields, the chat can still see that field.
- **Some APIs are experimental or unstable.** `experimental_toolApprovalSecret` in the AI SDK, and `unstable_useContentManagerContext` and `unstable_useDocument` in Strapi, can change in a minor release. Pin your versions and re-test the approval flow and the edit view panel after upgrades.
- **Medium's write API is archived.** It only ever supported creating posts, with no updates or deletes, and it may reject requests. Use **Test connection** before relying on it.
- **One tracked entry per document.** Localized versions of an entry aren't tracked separately yet.
- **Model ids go stale.** The chat's allowlist names specific Claude models and will need updating. `ANTHROPIC_MODEL` in `.env` sets the default.

## Conclusion

Content Publisher is a hidden content type, a service layer, and five ways to reach that service: a table, an edit view panel, a settings page, MCP tools and a public API. Because every path goes through the same `publish()` and the same permissions, adding an AI chat didn't need new rules. The chat can't do anything the Publish button can't, and the editor approves every post it makes.

The code is on [GitHub](https://github.com/Theodore-Kelechukwu-Onyejiaku/custom-strapi-plugin). The most useful places to start reading are `server/src/services/publish-post.ts`, `server/src/mcp/` and `server/src/permissions.ts`.

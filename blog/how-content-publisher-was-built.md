---
title: "How I built Content Publisher: a Strapi 5 plugin with an AI publishing assistant"
description: "A step-by-step look at how Content Publisher was built, from the tracking content type and the publish path to MCP tools and an AI chat that asks before it publishes."
author: Theodore Kelechukwu Onyejiaku
level: Intermediate
tags: [Plugins, MCP, AI, Strapi 5]
---

<!-- 🖼️ IMAGE: hero.png. The publishing table with the chat open, mid-conversation. -->

In [the first post](./building-content-publisher.md), I explained *why* Content Publisher works the way it does. This one shows *how* it was built, in the order I built it.

The code here is high level: enough to show the shape of each piece. The full source is in the [repo](https://github.com/Theodore-Kelechukwu-Onyejiaku/custom-strapi-plugin).

## Prerequisites

- Basic TypeScript, React and Strapi 5 knowledge
- A Strapi 5 project on v5.54.0 or later
- API keys or developer apps for the platforms you want to publish to
- An Anthropic API key for the AI chat

## What we're building

- A **tracking record** for every entry you might publish
- **Platform definitions** that the settings page builds its form from
- **One publish path** that every button, and the chat, goes through
- An **AI chat** that uses Strapi's MCP server and asks before it publishes

<!-- 🖼️ IMAGE: build-order.png. The steps below as a timeline: plugin → tracking → platforms → settings → publish path → sign-in → admin UI → MCP tools → agent → chat UI. -->

## Step 1: Scaffold the plugin

Strapi's plugin SDK creates a plugin with an `admin/` half and a `server/` half:

```bash
npx @strapi/sdk-plugin@latest init content-publisher
```

Enable it in the host project:

```ts
// config/plugins.ts
export default {
  'content-publisher': {
    enabled: true,
    resolve: './src/plugins/content-publisher',
  },
};
```

The server side ended up organised by job:

```
server/src/
├── content-types/   the tracking record
├── platforms/       one file per platform
├── services/        publish path, settings, sign-in, chat
├── mcp/             the AI's tools
├── routes/          admin routes behind permissions
└── register.ts      lifecycle hooks + MCP registration
```

## Step 2: The tracking record

Every entry gets one record that says where it has been published. It stores a content type uid and a document id instead of a relation, so it can track *any* collection type.

```ts
// server/src/content-types/post.ts
attributes: {
  contentType: { type: 'string' },     // e.g. api::blog.blog
  entryId: { type: 'string' },         // the entry's documentId
  title: { type: 'string' },           // snapshot, for listing and search
  entryPublished: { type: 'boolean' },
  devToLink: { type: 'text' },         // one link per platform
  mediumLink: { type: 'text' },
  // ...blueskyLink, linkedInLink, facebookLink
}
```

The type is hidden from the Content Manager with `pluginOptions`. Editors only see it through the plugin's own table.

## Step 3: Keep records in sync

Lifecycle hooks create and update records as entries change. The subscription has no model filter, because which types are publishable is a setting that can change at runtime.

```ts
// server/src/register.ts
strapi.db.lifecycles.subscribe({
  afterCreate: sync,
  afterUpdate: sync,
  afterDelete: removeOrResync, // unpublish also deletes a row, so check first
});
```

`sync` checks the current settings, then creates or updates the record. Entries that existed before a type was selected are picked up by a backfill:

```ts
// server/src/bootstrap.ts
await syncTrackingRecords(strapi);
```

## Step 4: Describe each platform

Each platform is a plain object: its API fields, which attribute types can feed each one, and the env vars it needs.

```ts
// server/src/platforms/devto.ts
const devTo: Platform = {
  key: 'devTo',
  label: 'Dev.to',
  envVars: ['DEVTO_API_KEY'],
  fields: [
    { key: 'title', label: 'Title', required: true, accepts: ['string', 'text'] },
    { key: 'main_image', label: 'Cover image', required: false, accepts: ['media'] },
    // ...body_markdown, canonical_url, tags
  ],
};
```

LinkedIn and Facebook add `oauth: { scopes: [...] }`, which swaps their settings card for a **Connect** button.

The settings page fetches this list and builds every dropdown from it. The admin code never names a platform.

<!-- 🖼️ IMAGE: platform-to-form.png. A platform definition on the left, the settings form it produces on the right. -->

## Step 5: Settings

Settings are configuration, not content, so they go in Strapi's core store:

```ts
// server/src/services/settings-store.ts
const store = (strapi) =>
  strapi.store({ type: 'plugin', name: 'content-publisher', key: 'settings' });

export const saveSettings = async (strapi, patch) => {
  const next = { ...(await getSettings(strapi)), ...patch };
  await store(strapi).set({ value: next });
  return next;
};
```

Field mappings are stored per platform and per content type, and checked before they're saved:

```ts
// server/src/services/setting-writes.ts
export const updatePlatform = async (strapi, platform, mapping) => {
  validateMapping(strapi, platform, mapping); // every attribute must exist
  // ...save under settings.platforms[platform.key]
};
```

<!-- 🖼️ IMAGE: settings-mapping.png. The Dev.to accordion with its field-mapping dropdowns. -->

## Step 6: Read an entry through the mapping

At publish time, the entry is converted into the platform's own field names. Each value is handled by its attribute type:

```ts
// server/src/services/resolve-fields.ts
if (type === 'media') return mediaUrl(raw, strapi);          // absolute URL
if (type === 'relation') return relationValues(raw, itemField); // ['strapi', 'mcp']
return raw ?? null;
```

## Step 7: One publish path

Every publish goes through one function. Each platform provides only `send`.

```ts
// server/src/services/publish.ts
export const publishEntry = async (strapi, post, platformKey, send) => {
  // 1. is the platform on?
  // 2. credentials: .env keys or the signed-in account's token
  const secrets = await secretsFor(strapi, settings, platform);
  // 3–4. load the entry and read it through the mapping
  const values = resolveFields(strapi, uid, platform, fieldMap, entry);
  // 5. send it
  const url = await send(values, secrets);
  // 6. record where it went
  await strapi.documents(POST_UID).update({
    documentId: post.documentId,
    data: { [LINK_FIELDS[platformKey]]: url },
  });
  return { url };
};
```

A publisher is a single request that returns the post's URL:

```ts
// server/src/services/publishers/devto.ts
export const sendToDevTo = async (values, secrets) => {
  const { data } = await axios.post(
    'https://dev.to/api/articles',
    { article: { title: values.title, body_markdown: values.body_markdown /* ... */ } },
    { headers: { 'api-key': secrets.DEVTO_API_KEY } }
  );
  return data.url;
};
```

Wiring a platform to the path takes one line:

```ts
// server/src/services/service.ts
publishPostToDevTo: (post) => publishEntry(strapi, post, 'devTo', sendToDevTo),
```

<!-- 🖼️ IMAGE: publish-path.png. The six steps of publishEntry(), with the error message each one can stop with. -->

## Step 8: Sign-in for LinkedIn and Facebook

These platforms use OAuth instead of API keys. The flow has two halves:

```ts
// server/src/services/oauth/flow.ts
export const startSignIn = async (strapi, platform, provider) => {
  const state = await createState(strapi, platform.key, redirectUri); // one-time, 10 minutes
  return { url: provider.authorizeUrl({ secrets, redirectUri, state, scopes }) };
};

export const finishSignIn = async (strapi, platform, provider, query) => {
  const pending = await consumeState(strapi, query.state, platform.key);
  if (!pending) return { ok: false, message: 'This sign-in link has expired.' };

  const account = await provider.connect({ code: query.code, secrets, redirectUri });
  await saveConnection(strapi, platform.key, account); // token encrypted before saving
  return { ok: true, message: `Connected ${platform.label} as ${account.accountName}.` };
};
```

The admin opens the provider's page in a popup and reloads the settings once it closes.

<!-- 🖼️ IMAGE: linkedin-connected.png. The LinkedIn card after connecting: account name, expiry, Reconnect. -->

## Step 9: Permissions

The plugin registers three actions when Strapi starts:

```ts
// server/src/bootstrap.ts
await strapi.service('admin::permission').actionProvider.registerMany([
  { section: 'plugins', pluginName: 'content-publisher', uid: 'read', displayName: 'Access the publishing table' },
  { section: 'plugins', pluginName: 'content-publisher', uid: 'settings-read', /* ... */ },
  { section: 'plugins', pluginName: 'content-publisher', uid: 'settings-update', /* ... */ },
]);
```

Each route requires one of them:

```ts
// server/src/routes/settings.ts
{ method: 'PUT', path: '/settings/platforms/:platform', handler: 'setting.updatePlatform',
  config: can(SETTINGS_UPDATE) },
```

## Step 10: The admin UI

The admin side registers a menu link, and injects a panel into every entry's edit view:

```tsx
// admin/src/index.tsx
register(app) {
  app.addMenuLink({
    to: `plugins/${PLUGIN_ID}`,
    icon: PluginIcon,
    Component: async () => (await import('./pages/App')).App,
    permissions: pluginPermissions.read,
  });
},

bootstrap(app) {
  app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
    name: 'content-publisher',
    Component: InjectedComponent,
  });
},
```

The table is built from the admin's own `Table`, `Filters`, `SearchInput` and `Pagination`. They keep their state in the URL, so the hook only forwards it:

```ts
// admin/src/hooks/usePostsQuery.ts
const [{ rawQuery }] = useQueryParams();
const { data } = await get(`/content-publisher/posts${rawQuery}`);
```

<!-- 🖼️ IMAGE: publishing-table.png. The table with the Publish menu open on one row. -->
<!-- 🖼️ IMAGE: content-manager-panel.png. The panel in a Blog entry's edit view. -->

At this point the plugin works without any AI.

## Step 11: Give the AI tools

Strapi 5 has a built-in MCP server. Turn it on:

```ts
// config/server.ts
mcp: { enabled: true },
```

The plugin adds three tools to it. The publish tool calls the same service the buttons use:

```ts
// server/src/mcp/publish-post.ts
export default ai.mcp.defineTool({
  name: 'content_publisher_publish_post',
  description: 'Publishes one post to one platform. This is public and cannot be undone...',
  auth: { policies: [{ action: 'plugin::content-publisher.read' }] },
  resolveInputSchema: () => z.object({ postId: z.string(), platform: z.enum(PLATFORM_KEYS) }),
  createHandler: (strapi) => async ({ args }) => {
    const post = await strapi.documents(POST_UID).findOne({ documentId: args.postId });
    const { url } = await service[PUBLISHERS[args.platform]](post);
    return ok(`Published to ${args.platform}: ${url}`, { url });
  },
});
```

The other two are `content_publisher_list_posts` and `content_publisher_list_platforms`.

Tools are registered in `register()`, because Strapi only accepts them before its MCP server starts:

```ts
// server/src/register.ts
registerMcpTools(strapi);
```

<!-- 🖼️ IMAGE: claude-code-mcp.png. Claude Code's /mcp view with the content_publisher tools listed. -->

## Step 12: The agent

The agent runs on the server. It connects to Strapi's own `/mcp` with an admin token and keeps only safe tools:

```ts
// server/src/services/chat/mcp-tools.ts
const isAllowed = (name) =>
  TOOL_NAMES.includes(name) ||                                    // the plugin's tools
  (/^(list|get)_/.test(name) && !name.includes('users-permissions')); // read-only content
```

Then it builds the agent with the Vercel AI SDK:

```ts
// server/src/services/chat/agent.ts
const agent = new ToolLoopAgent({
  model: anthropic(process.env.ANTHROPIC_MODEL || DEFAULT_MODEL),
  instructions: INSTRUCTIONS,
  tools,
  stopWhen: stepCountIs(12),
  toolApproval: { content_publisher_publish_post: 'user-approval' }, // ask first
  experimental_toolApprovalSecret: String(strapi.config.get('admin.auth.secret')),
});
```

`toolApproval` pauses the loop before any publish. The secret signs each approval request, so the browser can't fake one.

## Step 13: The chat route

A single route, behind the same permission as the table, streams the agent's answer back:

```ts
// server/src/controllers/chat.ts
async send(ctx) {
  const { agent, client } = await createChatAgent(strapi); // setup errors still return JSON
  ctx.respond = false;
  await pipeAgentUIStreamToResponse({
    response: ctx.res,
    agent,
    uiMessages: ctx.request.body.messages,
    onFinish: () => client.close(),
  });
},
```

## Step 14: The chat UI

On the admin side, the AI SDK's `useChat` sends the editor's token and continues automatically after an approval:

```ts
// admin/src/hooks/usePublisherChat.ts
return useChat({
  transport: new DefaultChatTransport({
    api: chatUrl(),
    headers: () => ({ Authorization: `Bearer ${tokenRef.current}` }),
  }),
  sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
});
```

An approval request renders as a card with two buttons:

```tsx
// admin/src/components/chat/ToolCall.tsx
<Button onClick={() => onRespond(part.approval.id, true)}>Publish</Button>
<Button variant="tertiary" onClick={() => onRespond(part.approval.id, false)}>Cancel</Button>
```

<!-- 🖼️ IMAGE: chat-approval.png. "Publish my newest post to Bluesky" with the approval card. -->
<!-- 🖼️ IMAGE: chat-published.png. The reply with the live Bluesky link after approval. -->

## Try it

1. Add your keys to `.env` and restart Strapi.
2. In **Publishing settings**, pick your collection types and map each platform's fields.
3. Click **Test connection** on each platform.
4. Publish from the table, or open the chat and ask.

## Wrapping up

The build came down to one idea: make a single publish path first, then add ways in. The table, the Content Manager panel and the chat are three doors to the same function, with the same permissions.

For the reasoning behind each decision, read [the first post](./building-content-publisher.md). For the full code, see the [repo](https://github.com/Theodore-Kelechukwu-Onyejiaku/custom-strapi-plugin) or run `npm install content-publisher`.

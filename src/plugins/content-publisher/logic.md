# logic.md

What has been added to this plugin and why. Newest first.

---

## The chat follows the editor's role

Before, the chat could use every read tool the shared `STRAPI_MCP_TOKEN` could, whoever was
chatting. Only publishing was checked per editor. Now every tool is checked against the
logged-in editor's role, so the chat can do no more than the Super Admin gave that role.

| Tool | Kept only if the editor's role has |
| --- | --- |
| `list_<type>`, `get_<type>` | Content Manager **Read** on that content type |
| `content_publisher_list_posts` | AI tools → List posts |
| `content_publisher_list_platforms` | AI tools → List platforms |
| `content_publisher_publish_post` | Publish posts to platforms **and** AI tools → Publish a post |
| create, update, delete, publish/unpublish of content, users | never |

| File | What it does |
| --- | --- |
| `server/src/services/chat/read-access.ts` | `chatAccess(strapi, userAbility)` works out what the role allows; `isAllowed(name, access)` decides per tool; `toolSlug(uid)` copies Strapi's MCP tool naming |
| `server/src/controllers/chat.ts` | Calls `chatAccess` with `ctx.state.userAbility` and passes it on |
| `server/src/services/chat/mcp-tools.ts` | Filters the token's tools with `isAllowed` |
| `server/src/services/chat/agent.ts` | Takes `access`; tells the model when it cannot publish |
| `server/src/services/chat/read-access.test.ts` | Checks the naming against Strapi's own `slugifyUidForMcpToolName`, and each rule above |

- **Names:** Strapi names read tools from the uid (`api::blog.blog` → `list_blog`,
  `plugin::users-permissions.user` → `list_plugin-users-permissions_user`). `toolSlug` does
  the same; the test fails if Strapi changes its naming.
- **Existing roles** do not have the AI tools permissions ticked, so their chat has no
  plugin tools until a Super Admin ticks them. Super Admin has all of them.
- **The token is still the upper limit.** The chat gets what both the token and the role
  allow. Give the token every permission the chat might need; the role narrows it down.
- **Not covered:** field-level rules. A role that can read a type but not one of its fields
  still gets that field, because Strapi applies field rules with the token's rights.

---

## Choosing the Claude model in the chat

A picker under the chat's message box lets the editor choose which Claude model answers.
It starts on the default: `ANTHROPIC_MODEL` from `.env`, or `claude-haiku-4-5` when unset
(the model the chat has always used). A change applies from the next message.

| Piece | Job |
| --- | --- |
| `server/src/services/chat/models.ts` | The allowed list, `defaultModel()`, and `resolveModel(requested)` |
| `GET /chat/models` (`read`) | Returns `{ models, defaultModel }` for the picker |
| `POST /chat` | Reads `model` from the body; `resolveModel` keeps it only if it is on the list |
| `admin/src/hooks/useChatModels.ts` | Loads the list; holds the editor's pick |
| `admin/src/hooks/usePublisherChat.ts` | Sends the pick with each request (transport `body`) |
| `admin/src/components/chat/ModelPicker.tsx` | The select; hidden if the list could not be loaded |

- **Allowed list, not free text:** the browser sends only an id, and the server ignores
  anything not on the list, so nobody can point the chat at an arbitrary or more expensive
  model. A non-listed `ANTHROPIC_MODEL` is added to the list so the default stays selectable.
- Models offered: Claude Haiku 4.5 (default), Haiku 5.5, Sonnet 5.5 and Opus 5.5. Claude
  Fable 5.1 is left out on purpose: it costs more than Opus and its long turns do not suit
  a quick chat. Add it to `CHAT_MODELS` if wanted.
- Still the Vercel AI SDK (`@ai-sdk/anthropic`); only the model id passed to `anthropic()`
  changed.

## Separate Publish and Delete permissions (`server/src/permissions.ts`)

"Access the publishing table" used to include publishing (public, permanent) and deleting.
Least privilege splits them:

| Action | uid | Checked by |
| --- | --- | --- |
| Access the publishing table | `read` | every post route, the chat route, menu link, `Page.Protect` |
| Publish posts to platforms | `publish` | `POST /posts/:id/publish/:platform` as `can(READ, PUBLISH)`; the chat |
| Delete posts from the publishing table | `delete` | `DELETE /posts/:id` as `can(READ, DELETE)` |
| Access / Change the publishing settings | `settings-read` / `settings-update` | settings routes and page |

- `can(...actions)` in `routes/can.ts` now takes several actions. Strapi's `hasPermissions`
  requires **every** one (it uses `actions.every`).
- **The chat:** it reaches the MCP tools with the server's `STRAPI_MCP_TOKEN`, not the
  editor's rights. So `controllers/chat.ts` works out what the editor's own role allows
  (`chatAccess` in `services/chat/read-access.ts`), and `isAllowed` drops every other tool
  before the agent sees them. See "The chat follows the editor's role" below.
- **Admin UI:** `hooks/usePostPermissions.ts` (`useRBAC`) gives `canPublish` / `canDelete`.
  The table checks once and hides the publish menu and delete button per role; the edit-view
  panel shows only "View on …" links without `canPublish`.
- `ACTIONS` is built with a small `action(uid, displayName, subCategory?)` helper and the
  ids with `id(uid)`, so adding an action is one line.
- New actions are not granted to existing roles: Super Admin gets them, others need them
  ticked.

## Drafts can no longer be published to platforms

Two holes, both closed on the server so the table, the edit view and MCP are all covered:

- `publishPost()` (`services/publish-post.ts`) published any tracked post, draft or not.
  It now refuses when `entryPublished` is false: "… is a draft. Publish it in Strapi first."
- `resolveSource()` loaded the entry with a bare `findOne`, and the Document Service
  returns the **draft** by default, so a published entry with unsaved edits sent those
  edits to the platform. It now uses `publishedVersion()` from `services/tracking.ts`
  (which already handled types with and without draft & publish), with the populate.

## Edit-view panel (`admin/src/components/EntryPublishPanel.tsx`)

Was `InjectedComponent.tsx`: one 176-line file that loaded data, published and rendered,
with its own copy of the publish logic that swallowed errors (a failed publish showed
nothing). Renamed for what it is, and split:

| File | Job |
| --- | --- |
| `components/EntryPublishPanel.tsx` | Picks the state: hidden, loading, load failed, save first, publish first, or the menu |
| `hooks/useEntryPost.ts` | Loads the entry's tracking post; refetches when the Content Manager status changes; `reload()` after a publish |
| `hooks/usePublishRow.ts` | Publishing, **shared with the table**: same toasts on success and failure |
| `components/entry/EntryPublishMenu.tsx` | The dropdown: "View on …" / "Publish to …" |
| `components/entry/EntryPublishStatus.tsx` | The line under it: "Publishing to …" or "Published everywhere" |
| `utils/trackedPost.ts` | `TrackedPost` type and `linkOf(post, target)` |

- The panel follows the entry's status with Strapi's `unstable_useDocument`, so clicking
  **Publish** in the Content Manager refreshes it without a reload.
- A failed load now says so, instead of "Save this entry first".
- Spacing uses the Design System's `paddingTop`, not an inline style.
- Fixed: with every platform turned off it said "Published everywhere" (0 of 0).

## One service per job, shared by every caller

Controllers, MCP tools and the chat call the **same registered service methods**. No caller
queries the database or publishes on its own, so a rule changed in a service applies
everywhere at once.

| Job | Service method | Called by |
| --- | --- | --- |
| List posts (search, paging) | `service('service').getPosts(query)` | table controller, MCP `list_posts` |
| One post for the edit view | `service('service').getSinglePost(query)` | controller |
| Delete a post | `service('service').deletePost(query)` | controller |
| Publish to a platform | `service('service').publish(platformKey, postId)` | controller, MCP `publish_post` |
| Platform on / ready? | `service('setting').platformStatus()` | MCP `list_platforms` |

- **Publishing:** the five `publishPostTo*` methods, five controller methods and five
  `/publish-to-*` routes became one `publish(platformKey, postId)` and one route,
  `POST /posts/:id/publish/:platform`. The admin builds the URL with `publishPath()` in
  `admin/src/components/platformTargets.ts`.
- **The post is loaded on the server** (`services/publish-post.ts`) instead of taken from the
  request body, so a caller cannot send its own `contentType` / `entryId`. The "already
  published there" check moved there from the MCP tool, so it applies to the table too.
- **MCP tools** call services through `pluginService()` in `mcp/shared.ts`, the same way
  controllers do. `list_posts` passes its `search` and `limit` to `getPosts` as `_q` and
  `pageSize`, the table's own params.

### Post routes (`server/src/routes/posts.ts`)

REST style: everything about posts sits under `/posts`, the HTTP method says what happens,
and a post's id goes in the path. All are behind "Access the publishing table" (`read`).
Admin routes are served at `/content-publisher/...`.

| Method | Path | Handler | Service |
| --- | --- | --- | --- |
| GET | `/posts` | `controller.getPosts` | `getPosts(query)` |
| GET | `/posts/by-entry?contentType=…&entryId=…` | `controller.getSinglePost` | `getSinglePost(query)` |
| POST | `/posts/:id/publish/:platform` | `controller.publish` | `publish(platform, id)` |
| DELETE | `/posts/:id` | `controller.deletePost` | `deletePost({ postId: id })` |

These are admin routes, so they are not listed anywhere in the admin panel; the permission
checkboxes that guard them are.

### Public content API (`routes/content-api.ts`, `controllers/posts.ts`)

Read-only, at `/api/content-publisher/...`, for a frontend that shows "Also on Dev.to"
links. Users & Permissions decides who may call them; they show as **Posts → find /
findByEntry** under Content-publisher and are granted to no one by default.

| Method | Path | Handler | Service |
| --- | --- | --- | --- |
| GET | `/posts` | `posts.find` | `getPosts(query)` |
| GET | `/posts/by-entry?contentType=…&entryId=…` | `posts.findByEntry` | `getSinglePost(query)` |

- Same service methods as the admin routes and MCP tools. The controller only trims each
  post with `toPublicPost()` (`services/public-post.ts`): title, contentType, entryId and
  the five links. The MCP list tool uses the same function, plus `postId`.
- Drafts are never returned: `getPosts` filters them out, and `findByEntry` answers 404
  for a post whose entry is not published (`isPublic()`).
- Responses follow Strapi's content-API shape: `{ data, meta: { pagination } }`.
- Which routes are public or private, and why:

| Route | Access |
| --- | --- |
| the two GETs above | Public role, or an API token to keep them private |
| publish | API token only, if ever needed; not built |
| delete, settings, platform status, connect, chat | admin only, never in the content API |

- Fixed on the way: `getSinglePost` returned an arbitrary record when `contentType` or
  `entryId` was missing (`$eq: undefined` matches anything). It now returns `null`.

## Tool permissions (`server/src/permissions.ts`)

Every MCP tool has its own admin action, so it shows up by name under
Plugins → Content Publisher → **AI tools** in Settings → Roles and Settings → Admin Tokens.

| Checkbox | Action | Tool |
| --- | --- | --- |
| List posts | `plugin::content-publisher.tool.list-posts` | `content_publisher_list_posts` |
| List platforms | `plugin::content-publisher.tool.list-platforms` | `content_publisher_list_platforms` |
| Publish a post | `plugin::content-publisher.tool.publish-post` | `content_publisher_publish_post` |

- They are in `ACTIONS`, so `bootstrap.ts` registers them with the other three.
- Each tool's `auth` uses `authFor(...)` from `mcp/shared.ts` with its own action.
- Before this, all three tools sat behind "Access the publishing table" (`read`). Tokens and
  roles that relied on that must now be given the new checkboxes.

## Publishing assistant (floating chat)

A chat button in the bottom-right corner of the plugin's pages. Editors ask things like
"what hasn't gone to LinkedIn yet?" or "publish the newest post to Bluesky", and the
assistant does it through the **same publish services** the table's menu calls.

### How it fits together

```
ChatLauncher / ChatPanel (admin)          useChat from @ai-sdk/react
  -> POST /content-publisher/chat          behind the `read` action, editor's admin JWT
    -> services/chat/agent.ts             ToolLoopAgent (Vercel AI SDK) + Claude
      -> services/chat/mcp-tools.ts       createMCPClient -> Strapi's own /mcp
        -> mcp/*.ts                       the plugin's MCP tools
          -> services/service.ts          the existing publish path
```

### The plugin's MCP tools (`server/src/mcp/`)

Registered from `register()` — Strapi refuses new tools once its MCP server has started.
Any MCP client (Claude Desktop, Cursor …) can use them too, not just the chat.

| Tool | What it does |
| --- | --- |
| `content_publisher_list_posts` | Tracked entries and the URL each platform published them at |
| `content_publisher_list_platforms` | Which platforms are on, and whether keys / sign-in are ready |
| `content_publisher_publish_post` | Publishes one post to one platform via `service('service').publish` |

All three are gated by `plugin::content-publisher.read`, so an admin token only sees them if
it was granted "Access the publishing table".

### What the chat may do

- **Read:** the plugin's tools plus Strapi's read-only Content Manager tools (`list_*`,
  `get_*`), minus user accounts.
- **Write:** only `content_publisher_publish_post`, and only after the editor clicks
  **Publish** on an approval card. The approval is signed with the admin JWT secret
  (`experimental_toolApprovalSecret`) so a browser cannot fake one.
- Create/update/delete tools are not given to the model at all.

### Setup (.env only, like every other secret)

```
ANTHROPIC_API_KEY=...        # console.anthropic.com
ANTHROPIC_MODEL=             # optional; default claude-haiku-4-5
STRAPI_MCP_TOKEN=...         # an admin token for /mcp
```

The admin token (Settings → Administration Panel → Admin Tokens) needs the plugin's
"Access the publishing table" permission, plus Content Manager *read* on the types it
should see (Blog, Tag). Missing values make the chat answer with a message saying which
one to add, instead of failing silently.

Strapi's MCP server **hides** a tool from a token that lacks the tool's permission; it
does not raise an error. So a token without "Access the publishing table" still connects
and still sees `list_blog`, but never sees `content_publisher_*`. Without a check, the
model then tells the editor it "can't publish" without saying why. `services/chat/mcp-tools.ts`
checks for the plugin's tools after connecting and, if they're missing, the chat answers
with which permission to tick on the token.

### How the chat looks

Modelled on ChatGPT and Claude. All colours come from the admin theme, so light and dark
mode both work.

| Piece | What it does | File |
| --- | --- | --- |
| Launcher | Round purple button, bottom right; sparkle icon, cross when open | `ChatLauncher.tsx`, `fabStyles.ts` |
| Window | 400×620, rounded, soft shadow; fades and rises in. Stays mounted while closed, so the conversation is kept | `windowStyles.ts` |
| Header | Assistant badge, name, platforms; **New chat** (stops any answer, clears messages and errors) and close | `ChatHeader.tsx` |
| Editor's messages | Grey rounded bubble on the right, plain text | `ChatMessage.tsx` |
| Assistant's replies | No bubble, full width, Markdown; a **Copy** button under each finished reply | `ChatMessage.tsx`, `CopyButton.tsx` |
| Message box | Rounded field that grows with the text (`hooks/useAutoGrow.ts`); round send button that becomes **Stop** while the assistant answers; "Nothing is published until you approve it." underneath | `ChatInput.tsx`, `composerStyles.ts` |

`ChatPanel.tsx` holds the useChat state, so it renders the header too (New chat needs
`setMessages`, `stop` and `clearError`).

### Starter questions

An empty chat shows a greeting and a few ready-made questions as cards (`Suggestions.tsx`),
like the starter prompts in ChatGPT or Claude. Clicking one sends it straight away, exactly as if it had been
typed. They disappear once the conversation starts. To change them, edit `QUESTIONS` in
that file. "Publish my newest post to Bluesky" is safe as a one-click starter because the
publish still stops at the approval card.

### What the editor sees while the assistant works

Like ChatGPT, Claude and Gemini, the chat shows progress in words, not a spinner. All of it
comes from the real useChat state; nothing is faked.

| Moment | What shows | Where |
| --- | --- | --- |
| Waiting for the first reply, the model reasoning, or between steps | "Thinking…" with a shine sweeping across | `ChatPanel.tsx`, decided by `isThinking` in `activity.ts` |
| A tool is running | "Looking up posts…" (shining) | `ToolCall.tsx` |
| A tool finished | "✓ Looked up posts", or "✗ …" with the error, or "Cancelled" | `ToolCall.tsx` |
| The answer is streaming | the text as it arrives, with a blinking `▍` after the last word | `ChatMarkdown.tsx` |

- Tool names in words (running and done) live in `LABELS` in `activity.ts`. A tool not
  listed there shows as "Using list_blog…" / "Used list_blog".
- The shine and cursor are styled-components in `StatusText.tsx`; both stop animating when
  the editor's system asks for reduced motion.
- **Replies are rendered as Markdown** (`ChatMarkdown.tsx`) with `react-markdown` and
  `remark-gfm` (tables, strikethrough, bare URLs as links). The editor's own messages stay
  plain text. Raw HTML in a reply is ignored, not rendered, so text the model read from a
  blog post can't inject anything into the admin. Links use the design system's `Link` and
  open in a new tab. The styles (`markdownStyles.ts`) use the admin theme's colours, so
  replies follow light and dark mode. The cursor is a CSS `::after` on the last paragraph
  or list item, so it stays on the last line even inside formatting.
- While a reply streams in, half-finished Markdown (e.g. `**bold` before its closing `**`)
  can show its symbols for a moment until the rest arrives.
- **The model's reasoning is never shown.** If the model sends reasoning parts,
  `ChatMessage.tsx` skips them; the editor only sees "Thinking…" while it reasons.

---

## Dead code removed

Files nothing imported any more, left over from the old one-button-per-platform table and the
pasted-key settings: `PublishButton`, `PublishState`, `usePublishActions`, `table/PostsTable`,
`table/PostRow`, `table/PlatformChips`, `table/TablePagination`, `table/TableToolbar`,
`settings/PlatformHeader`, `utils/timeAgo`, `utils/getTranslation`, and
`server/src/controllers/test.ts` (an unregistered copy of `controller.ts`).

Also gone: the empty `getBlogs` handler and its public `GET /api/content-publisher/blogs`
route (it answered every request with nothing), the empty `PENDING_PLATFORMS` list, the
unused `setting.getSettings()` service method, and unused imports.

---

## Post type hidden from the Content Manager

`plugin::content-publisher.post` is the plugin's own tracking record, so it is now hidden from
the Content Manager and the Content-Type Builder (`pluginOptions.*.visible: false`). Editors see
these records through the publishing table instead. Set in both `server/src/content-types/post.ts`
and the host's override at `src/extensions/content-publisher/content-types/post/schema.json`,
because the override replaces the plugin's schema.

---

## LinkedIn and Facebook ("Connect" sign-in)

These two do not take an API key. The editor clicks **Connect LinkedIn** / **Connect
Facebook** in the settings page, signs in on the provider's own page in a popup, and the
plugin stores the token it gets back.

### Setup

The app's client id and secret come from `.env` only. They cannot be saved from the admin
panel (`setting-writes.ts` refuses), and the settings page shows no input for them.

```
LINKEDIN_CLIENT_ID=...       LINKEDIN_CLIENT_SECRET=...
FACEBOOK_APP_ID=...          FACEBOOK_APP_SECRET=...
```

Register this redirect URL in each app (the settings page shows the exact value):

```
<server url>/content-publisher/connect/linkedIn/callback
<server url>/content-publisher/connect/facebook/callback
```

- LinkedIn app: enable "Share on LinkedIn" and "Sign In with LinkedIn using OpenID Connect".
  Scopes: `openid profile w_member_social`.
- Meta app: add Facebook Login. Scopes: `pages_show_list pages_manage_posts
  pages_read_engagement`. Posting is to a **Page** — Meta does not allow apps to post to
  personal profiles. Until the app passes Meta's App Review, only people added to the app as
  admins/testers can connect.

### The flow

```
Connect button (usePlatformConnection)
  -> POST /settings/platforms/:platform/connect     -> oauth/flow.ts startSignIn
       creates a one-time `state` (oauth/state.ts), returns the provider URL
  -> popup opens linkedin.com / facebook.com, editor signs in
  -> GET /connect/:platform/callback?code&state     -> oauth/flow.ts finishSignIn
       checks + deletes the state, swaps the code for a token (oauth/linkedin.ts,
       oauth/facebook.ts), saves it encrypted (oauth/connections.ts)
  -> the admin page sees the popup land on "Connected", closes it, reloads settings
```

The callback is `auth: false` because the provider calls it, not the admin app. The
one-time, ten-minute `state` is what stops anyone else from using it.

### Where the token lives

`settings.connections[platformKey]` in the plugin's core store, encrypted with
`admin::encryption`. `presentSettings` replaces it with `{ redirectUri, account }` — name and
expiry only, never a token — before anything reaches the browser.

- LinkedIn tokens last 60 days and cannot be refreshed, so the page shows the expiry and a
  Reconnect button.
- Facebook: the user token is swapped for a long-lived one, and the Page tokens fetched with
  it never expire. If the user manages several Pages, a dropdown picks which one to post as.

### Publishing

`publish-secrets.ts` decides what a publisher gets: API keys for Dev.to/Medium/Bluesky, or
`{ ACCESS_TOKEN, ACCOUNT_ID }` from the connection for LinkedIn/Facebook.

- `publishers/linkedin.ts` posts an article share to `/rest/posts` (`LinkedIn-Version`
  header, bump it yearly). LinkedIn does not scrape links, so the card is the mapped heading
  and summary.
- `publishers/facebook.ts` posts `message` + `link` to `/{page-id}/feed`.

The tracking record gained `linkedInLink` and `facebookLink`.

---

## Publishing settings

Lets an editor choose which collection types they publish from, and map each platform's
API fields onto that type's attributes. Written so the plugin stops assuming an
`api::blog.blog` collection exists — the last thing blocking a Marketplace release.

### Where the settings live

Strapi's core store, not a content type:

```ts
strapi.store({ type: 'plugin', name: 'content-publisher', key: 'settings' })
```

Same place upload and i18n keep theirs. They are admin-only configuration, not content, so
they have no business showing up in the Content Manager.

Shape:

```json
{
  "contentTypes": ["api::blog.blog"],
  "platforms": {
    "devTo": {
      "api::blog.blog": {
        "title": "title",
        "body_markdown": "content",
        "tags": "tags",
        "tags__item": "blogTag"
      }
    }
  }
}
```

The mapping is keyed by content type uid because two types can name the same concept
differently — a Blog's `body` and an Article's `section` both feed dev.to's
`body_markdown`. A relation stores two values: `tags` names the relation, and
`tags__item` names the attribute on the *related* type that holds the text.

### Adding a platform

1. Write `server/src/platforms/<name>.ts` describing its API fields — each field's `key`
   (what the API expects), `label`, `required`, and `accepts` (the Strapi attribute types
   it can be mapped from).
2. Add it to `PLATFORMS` in `server/src/platforms/index.ts`.
3. Add a `<name>Link` attribute to `content-types/post.ts`, map the platform key to it in
   `LINK_FIELDS` (`services/publish-config.ts`), write the request in
   `services/publishers/<name>.ts`, and add it to `senders` in `services/publish-post.ts`.
   No new route, controller method or MCP change: `/posts/:id/publish/:platform` and the MCP tool
   take any platform key.
4. Optionally add an icon and blurb to `PLATFORM_META` in
   `admin/src/components/settings/platformMeta.ts`, and a target in
   `admin/src/components/platformTargets.ts` so it shows in the publish menu.

Nothing in the admin panel needs changing: the settings page builds its dropdowns from
whatever the server serves, and filters each one by that field's `accepts`.

### Routes

All three are authenticated with `admin::isAuthenticatedAdmin`, like the post routes.
Every route behind an RBAC action builds its config with `can(action)` from
`routes/can.ts`.

| Method | Path | Handler |
| --- | --- | --- |
| GET | `/settings` | `setting.find` |
| PUT | `/settings/content-types` | `setting.updateContentTypes` |
| PUT | `/settings/platforms/:platform` | `setting.updatePlatform` |

Every write is validated in `services/mapping-validator.ts` before it reaches the store.
The store accepts any JSON, so without that a mistyped attribute name saves happily and
only fails later, at publish time, with an error that points nowhere near the cause.

### How publishing reads the mapping

```
controller.publish  /  MCP content_publisher_publish_post
  -> service('service').publish(platformKey, postId)
    -> services/publish-post.ts   (loads the post, refuses if already published)
    -> services/publish.ts        (loads the mapping, resolves, records the URL)
      -> services/resolve-fields.ts   (entry + mapping -> platform field values)
      -> services/publishers/devto.ts (values -> the dev.to request)
```

`resolveFields` walks the platform's declared fields and reads each one through the saved
mapping. It uses the attribute's *type*, not its name, to decide what to do:

- `media` -> the file's URL, prefixed with the server's absolute URL when the upload is
  stored relative, since dev.to and Medium cannot fetch `/uploads/x.png`
- `relation` -> the text of each related entry, read from the attribute recorded under
  `<fieldKey>__item`
- anything else -> the value as-is

An unmapped field resolves to `null` and the publisher leaves it out.

Nothing in `publishers/` knows which attribute a value came from — they receive a plain
object keyed by the platform's own field keys.

### The fallback

`LEGACY_MAPS` in `services/publish-config.ts` holds the `api::blog.blog` field names the
plugin used before settings existed. It is used whenever a platform has nothing saved, so
an install that upgrades without opening the settings page keeps publishing exactly as it
did.

### The settings page layout

Platforms render inside a single `Accordion.Root`, one `Accordion.Item` per platform.
Everything starts collapsed, so the page opens as a short list of platform names rather
than every mapping at once — clicking a name opens that platform's fields. The root is
Strapi's single-type accordion, so opening one closes the other, and `collapsible` lets you
close the open one again.

The on/off switch sits in `Accordion.Actions`, outside the trigger, so flipping it does not
open or close the row.

### What the publish surfaces read

The publishing table and the content-manager panel do **not** read `/settings`: that route is
behind `settings-read`, and an editor may be allowed to publish without being allowed to see
where content goes or which keys are set. They read `GET /publish-targets` instead, which is
behind plain `read` and returns only the publishable collection types and which platforms are
switched on — no mappings, no credentials.

Both surfaces filter their platform list through it (`admin/src/hooks/usePublishTargets.ts`),
so a platform switched off loses its table column and its menu entry rather than offering a
button the server would refuse.

Note the two key spellings: the publish endpoint says `devto`, the platform definition on the
server says `devTo`. `platformTargets.ts` carries both — `type` for the endpoint, `key` for
matching against the server.

### The on/off switch

Each platform carries an `enabled` flag, stored alongside the mappings:

```json
{ "enabled": { "devTo": true, "medium": false } }
```

A missing flag counts as enabled, so an install that never opens the settings page keeps
publishing. `services/publish.ts` refuses an explicitly disabled platform, so the switch
decides what actually happens rather than only what the page shows.

### Bluesky

Not a blogging platform, so it does not follow the Dev.to/Medium shape. A post is at most
**300 graphemes and 3,000 UTF-8 bytes**, and there is no article body — the useful form is a
short line plus a link card back to the original.

Publishing takes three calls (`server/src/services/publishers/bluesky/`):

1. `com.atproto.server.createSession` with an **app password** (Settings > App Passwords,
   never the account password) returns an `accessJwt` and the `did` to write to.
2. `com.atproto.repo.uploadBlob`, only when a card image is mapped, returns the blob ref.
   The lexicon caps it at 1,000,000 bytes; anything larger is logged and skipped rather than
   failing the post.
3. `com.atproto.repo.createRecord` writes the `app.bsky.feed.post`. Its `at://` uri ends in
   the rkey, which is what builds the `bsky.app/profile/<did>/post/<rkey>` permalink stored
   on the tracking post.

`text.ts` enforces both limits. They are not the same cap: 299 family emoji are 299
graphemes but roughly 10,000 bytes, so graphemes alone would send posts the API rejects.
Grapheme counting uses `Intl.Segmenter`, falling back to code points where it is absent.

`uri`, `title` and `description` are all required by `app.bsky.embed.external`, so the card
is attached only when a link is mapped; without one the post goes out as plain text.

### The publishing table

Built on Strapi's own `Table`, `Filters`, `SearchInput`, `Pagination` and `useQueryParams`
from `@strapi/strapi/admin` — the same components the Content Manager list view uses — rather
than hand-rolled equivalents. They keep their state in the URL, so sorting, filtering, the
search term and the page survive a refresh, are shareable, and work with the back button.
`usePostsQuery` forwards `rawQuery` to the server untouched.

`services/list-query.ts` translates that query into document-service arguments and whitelists
what may be sorted and filtered. These routes are still unauthenticated (PROGRESS.md item 10),
so a stray `filters[createdBy][id]` must not become a database query.

**Platforms share one cell, not a column each.** A column per platform stopped fitting at
three and would be unusable at ten. Instead:

- `Published to (n)` holds the count plus one icon per platform, full strength when published
  and faded when not; a published icon opens the live post.
- `Actions` holds a `Publish (n)` menu listing only the platforms this entry is not on yet,
  plus *Everywhere remaining*, then delete.

So the row is the same width with ten platforms as with two, and adding a platform costs no
horizontal space.

Three `Table` parts are re-typed in `components/table/tableParts.tsx`. `Table.Row`, `Cell` and
`Empty` accept children at runtime — Content Manager uses them that way — but are declared as
`interface RowProps extends RawTrProps {}`, and extending a polymorphic type alias in an
interface loses the members. That is upstream, so it is narrowed to three aliases rather than
cast at every call site.

### Tracking any collection type

The tracking record used to be a `oneToOne` relation to `api::blog.blog`, so it physically
could not point at anything else — you could tick another collection type in Settings, map its
fields, and nothing would ever appear. The relation is replaced by a pair of plain columns:

```
contentType     api::article.article
entryId         abc123
title           "How we ship"     <- snapshot
entryUpdatedAt  2026-09-20        <- snapshot
```

Strapi cannot relate to "whichever types the editor picked", so the reference is a uid plus a
documentId. `title` and `entryUpdatedAt` are snapshots, which keeps listing and searching a
single query on one table instead of a lookup per row across several content types.

**Lifecycles** (`register.ts`) subscribe with no `models` filter on purpose: which types are
publishable is a runtime setting, so a fixed list would go stale the moment it changed. Every
model is seen and the handler checks the current settings, so ticking a type takes effect with
no restart. `afterUpdate` refreshes the snapshot; `afterDelete` removes orphaned records.

**Backfill** (`services/backfill.ts`) covers what lifecycles cannot: entries that already
existed when a type was selected. It runs on boot and again right after the selection is
saved, and is idempotent.

**Publishing** resolves through `post.contentType` rather than a fixed uid. `api::blog.blog`
still falls back to `LEGACY_MAPS` so existing installs are untouched; any other type must be
mapped explicitly, and says so instead of publishing a post with every field empty.

`blog` is still declared on the content type, and still written for blog entries, so the
`post` field on `api::blog.blog` and any older row keep working. Nothing reads it.

### Errors reaching the caller

Strapi's error middleware recognises its own errors with `instanceof`. This plugin resolves
its own copy of `@strapi/utils`, so the classes it throws are different objects from the ones
the host checks against — the check failed, the middleware fell through to a line that itself
crashed, and every plugin error arrived as a bare 500 with no body. "Could not publish to
Medium: Request failed with status code 429" only ever reached the terminal.

`middlewares/plugin-errors.ts` catches on the plugin's own routes and matches on `error.name`
rather than the class, which sidesteps the two-copies problem entirely: every Strapi error
class sets its own name. It rebuilds the response in Strapi's shape
(`{ data, error: { status, name, message, details } }`) using the same status mapping as
`@strapi/core`, so the admin panel reads it like any other error.

An unrecognised throw is a genuine bug, so it is logged server-side and returned as a plain
500 rather than echoed to the client.

### Permissions

Three RBAC actions, registered in `server/src/bootstrap.ts` from `server/src/permissions.ts`:

| Action | Guards |
| --- | --- |
| `plugin::content-publisher.read` | the menu link and the publishing table |
| `plugin::content-publisher.settings-read` | `GET /settings` and the settings route |
| `plugin::content-publisher.settings-update` | every settings write |

`settings-read` is deliberately separate from `read`: the settings payload says where your
content goes and which credentials are configured, so seeing the table should not imply
seeing that. The routes pair `admin::isAuthenticatedAdmin` with `admin::hasPermissions`,
the same way content-releases and upload do.

Dashes, not dots. `useRBAC` names its `allowedActions` from the **last dot-segment** of the
action, split on dashes — so `settings.update` would arrive as `canUpdate`, and
`settings.read` would collide with `read` as `canRead`. `settings-update` is what produces
the `canSettingsUpdate` the settings page checks. Strapi's own plugins name actions the
same way (content-releases uses `create-action` -> `canCreateAction`).

New actions are not granted to existing roles automatically. Super Admin gets them on boot;
every other role needs them ticked under *Settings > Roles*.

### API keys

Each platform declares the env vars it needs, and **they are read from the project's root
`.env` file only** (`services/credentials.ts` → `resolveSecrets`). There is no way to enter
a key in the admin panel: a key pasted into a form ends up in the database and its backups,
and is one shoulder-surf away from leaking.

- The settings page shows each env var as **Set in .env** or **Missing**, read-only.
- `services/present-settings.ts` sends `{ configured }` per env var — not the value, not
  even its last characters.
- The old `PUT /settings/platforms/:platform/credentials` route is gone. Keys saved through
  it by earlier versions are ignored, and `settings-store.ts` drops them from the store on
  the next settings save.
- Changing a key means editing `.env` and restarting Strapi.

`ENCRYPTION_KEY` (read in `config/admin.ts` as `admin.secrets.encryptionKey`) is still
required — for the LinkedIn and Facebook sign-in tokens, which are issued at runtime and so
have to be stored.

### Still coupled

`BLOG_UID` in `services/publish-config.ts` is still `'api::blog.blog'`, because
`content-types/post.ts` declares a `oneToOne` relation to it. Field *names* are now free,
but the content *type* is not. Making it generic needs a schema change and a migration —
see PROGRESS.md item 16.

### Cleanup (removed as unused or duplicated)

- `GET /search` and its controller/service code (`getSearchQuery`, `POSTS_PER_PAGE`): the
  table searches through `GET /posts?_q=`, so nothing called it.
- `fixedOptions` on the platform definitions: never read; each publisher sets those values
  in its own request.
- The platform → link field map now lives once, as `LINK_FIELDS` in
  `services/publish-config.ts`. `publishEntry` looks the field up from the platform key,
  and the MCP tools and `list-query.ts` reuse it.
- `missingEnvVars` in `services/credentials.ts` replaces the same filter written in
  `publish-secrets.ts` and `oauth/flow.ts`.
- The no-op `destroy.ts`, the empty `policies/`, the admin plugin's unused own
  `injectionZones`, `getTarget`, and the `type` field on `PlatformTarget` (it duplicated `key`).

## Strapi Marketplace readiness (2.0.0)

Changes made against the [Marketplace guidelines](https://community.strapi.io/help/market-guidelines):

- **Version 2.0.0.** The permission and route changes in CHANGELOG.md are breaking, so this
  is a major version, not 1.x.
- **Description** (`description` and `strapi.description`, 119 characters) names all five
  platforms. The guideline asks for 50–150 characters.
- **`logo.png`**, 160×160, exported from `logo.svg` with
  `rsvg-convert -w 160 -h 160 logo.svg -o logo.png`. The Marketplace takes PNG or JPG only.
  It's listed in `files`, so it ships in the npm package.
- **Dependencies:** `npm audit --omit=dev` reports 0 vulnerabilities. `zod` is a direct
  dependency (`^4.6.7`): the AI SDK packages only list it as a peer, and npm had resolved it
  to 4.4.3, which is vulnerable. The issues left in `npm audit` all come from dev tooling
  (`@strapi/strapi`, `@strapi/sdk-plugin`, `vitest`), none of which ship to users.
- **Tests:** `server/src/services/chat/models.test.ts` covers the chat's model allowlist.
  `server/tsconfig.build.json` already excludes `*.test.ts`, so tests never reach `dist`.
- **README:** a prerequisites section, a "Reporting issues" section, the chat marked as
  optional (the free-to-use rule), and a note that `STRAPI_MCP_TOKEN` is only sent to the
  project's own `/mcp`.
- **`TOOLS` has an explicit type** (`McpTool[]` in `mcp/index.ts`). After the zod update,
  Strapi keeps its own nested copy of zod, and the build failed with TS2742 because the
  inferred type of `TOOLS` pointed into it.

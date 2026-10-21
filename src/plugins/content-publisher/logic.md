# logic.md

What has been added to this plugin and why. Newest first.

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
3. Add a publish function in `server/src/services/service.ts`.
4. Optionally add an icon and blurb to `PLATFORM_META` in
   `admin/src/components/settings/platformMeta.ts`, and a target in
   `admin/src/components/platformTargets.ts` so it shows in the publish menu.

Nothing in the admin panel needs changing: the settings page builds its dropdowns from
whatever the server serves, and filters each one by that field's `accepts`.

### Routes

All three are authenticated with `admin::isAuthenticatedAdmin`, unlike the six post routes,
which are still `auth: false` (see PROGRESS.md item 10).

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
controller.publishPostToDevTo
  -> services/service.ts          (wiring only)
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

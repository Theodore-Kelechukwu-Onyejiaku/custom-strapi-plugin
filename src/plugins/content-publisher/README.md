<p align="left"><img src="./logo.svg" width="72" alt="Content Publisher"></p>

# Content Publisher

Publish Strapi content to **Dev.to**, **Medium**, **Bluesky**, **LinkedIn** and
**Facebook** from the admin panel, and keep track of where each entry ended up.

You choose which collection types are publishable, map each platform's fields onto your own
attributes, and publish from either the plugin's page or the Content Manager's edit view.

The plugin is free and every feature works without a paid service. The optional AI chat
uses your own Anthropic API key; nothing else needs it.

## Prerequisites

- Strapi **5.54 or later** (built and tested on 5.60)
- Node.js **20 or 22**
- An account on each platform you want to publish to, with an API key or app

## Install

```bash
npm install content-publisher
# or
yarn add content-publisher
```

Enable it in `config/plugins.ts`:

```ts
export default {
  'content-publisher': { enabled: true },
};
```

### Required: an encryption key

The LinkedIn and Facebook sign-in tokens are encrypted before they are stored, using
Strapi's own encryption service. Add a key to `config/admin.ts`:

```ts
export default ({ env }) => ({
  // ...existing config
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY'),
  },
});
```

```bash
# .env
ENCRYPTION_KEY=<a random string>
```

Without it the plugin **refuses** to store a token rather than storing it in plain text. New
Strapi projects generate this value already.

## Setup

Go to **Content Publisher → Publishing settings**.

1. **Collection types** — pick what you publish from. Entries that already exist are picked
   up straight away, not just ones created afterwards.
2. **Platforms** — open a platform to check its credentials and map its fields.

### Credentials

Credentials go in your Strapi project's **root `.env` file only** — there is deliberately no
way to type or paste them into the admin panel. Restart Strapi after changing `.env`.

| Platform | Credentials | Where to get them |
| --- | --- | --- |
| Dev.to | `DEVTO_API_KEY` | Settings → Extensions → API Keys |
| Medium | `MEDIUM_USER_ID`, `MEDIUM_API_TOKEN` | Settings → Integration tokens |
| Bluesky | `BLUESKY_IDENTIFIER`, `BLUESKY_APP_PASSWORD` | Your handle, plus Settings → Privacy and Security → App Passwords |
| LinkedIn | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | Your app at linkedin.com/developers, then click **Connect LinkedIn** |
| Facebook | `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` | Your app at developers.facebook.com, then click **Connect Facebook** |

The settings page shows each one as **Set in .env** or **Missing** — never the value or any
part of it. Use **Test connection** to check them without publishing anything.

> Bluesky wants an *app password* (`xxxx-xxxx-xxxx-xxxx`), never your account password. It is
> revocable and cannot change your account.

### Field mapping

Each platform declares the fields its API expects, and you choose which of your attributes
feeds each one. Dropdowns are filtered by type, so a cover image field only offers media
attributes. Relations get a second dropdown for the attribute holding the text — pick `tags`,
then `name`.

A collection type with no mapping is told so at publish time rather than quietly sending a
post with empty fields.

## Publishing

**From the plugin page** — a table of every published entry, showing which platforms each one
has reached. Publish to one platform or to everywhere remaining at once.

**From the Content Manager** — a panel in the edit view of any configured collection type.

Only entries that are **published in Strapi** are listed. Drafts are not offered, and moving
an entry back to draft hides it without losing the record of where it was already published.

## Permissions

Five actions, under *Settings → Roles*:

| Action | Grants |
| --- | --- |
| `Access the publishing table` | the menu link, the publishing table, the edit-view panel and the chat (read-only) |
| `Publish posts to platforms` | publishing from the table, the edit view and the chat; needs the table permission too |
| `Delete posts from the publishing table` | deleting tracking records; needs the table permission too |
| `Access the publishing settings` | viewing the settings page |
| `Change the publishing settings` | saving mappings and credentials |

A role with only *Access the publishing table* sees where everything is published but
cannot publish or delete.

The chat follows each editor's role too. It can only look up content types the role can
read in the Content Manager, and only use the plugin tools ticked for that role under
**AI tools**. Publishing from the chat needs both *Publish posts to platforms* and
*Publish a post*. Existing roles need the AI tools ticked before the chat can use them.

Under **AI tools**, one action per MCP tool, so an admin token or role can be given each
tool on its own (for example the two list tools without publishing):

| Action | Tool |
| --- | --- |
| `List posts` | `content_publisher_list_posts` |
| `List platforms` | `content_publisher_list_platforms` |
| `Publish a post` | `content_publisher_publish_post` |

Settings are kept separate from the table on purpose: seeing what you can publish should not
imply seeing where it goes or which credentials exist. New actions are not granted to existing
roles automatically — Super Admin has them, everyone else needs them ticked.

## Public API (read-only)

Two content-api routes let a frontend show where an entry was published, for example
"Also on Dev.to / Medium" links under a blog post, or a canonical link.

| Route | Returns |
| --- | --- |
| `GET /api/content-publisher/posts?_q=&page=&pageSize=` | Published entries and their platform links, paginated (max 100 per page) |
| `GET /api/content-publisher/posts/by-entry?contentType=api::blog.blog&entryId=<documentId>` | One entry's links, or 404 if it is not published |

```json
{
  "data": {
    "title": "Understanding Strapi 5's Document Service API",
    "contentType": "api::blog.blog",
    "entryId": "x8k2…",
    "published": { "devTo": "https://dev.to/…", "medium": null, "bluesky": "https://bsky.app/…", "linkedIn": null, "facebook": null }
  }
}
```

They are **off until you grant them**: *Settings → Users & Permissions → Roles → Public →
Content-publisher → Posts*, tick `find` and/or `findByEntry`. Or tick them on an API token
instead to keep them private to your frontend's server.

Only published entries and their links are returned; drafts and internal fields never are.
Publishing, deleting and settings stay admin-only, with no content-api route.

## Adding a platform

1. Describe the API's fields in `server/src/platforms/<name>.ts`.
2. Add it to `PLATFORMS` in `server/src/platforms/index.ts`.
3. Write the request in `server/src/services/publishers/` and add it to `senders` in
   `server/src/services/publish-post.ts`. The publish route, controller and MCP tool take
   any platform key, so they need no change.

The settings page builds itself from that definition, so no admin code changes.

## Known limitations

- **Medium's write API is archived.** It only ever supported creating posts — no updates, no
  deletes, no stats — and may reject requests outright. Test the connection before relying
  on it.
- **Bluesky posts are capped** at 300 graphemes and 3,000 UTF-8 bytes. Longer text is trimmed
  on a grapheme boundary, and a link card points back at the original.
- **One tracked entry per document.** Localised entries are not yet handled separately.

## Publishing assistant (optional chat)

The chat is optional. Without the variables below the rest of the plugin works the same.

A floating chat button on the plugin's pages lets editors ask what has been published where,
and publish posts by asking. Every publish waits for the editor to click **Publish** in the
chat. It runs on the Vercel AI SDK and Claude, and works through Strapi's built-in MCP
server, so it uses the same publish logic as the table.

Add to your project's `.env` and restart Strapi:

```bash
ANTHROPIC_API_KEY=...   # from console.anthropic.com
STRAPI_MCP_TOKEN=...    # Settings → Administration Panel → Admin Tokens
# ANTHROPIC_MODEL=claude-sonnet-5-5   # optional; the default model, otherwise claude-haiku-4-5
```

MCP must be on in `config/server.ts` (`mcp: { enabled: true }`). Give the admin token the
three **AI tools** permissions under Content Publisher and Content Manager **read** on your
publishable types.

`STRAPI_MCP_TOKEN` stays in your own `.env`. The plugin only sends it to your Strapi's own
`/mcp` endpoint, never to Anthropic or any other service.

## Reporting issues

Found a bug or want a feature? Open an issue at
[github.com/Theodore-Kelechukwu-Onyejiaku/custom-strapi-plugin/issues](https://github.com/Theodore-Kelechukwu-Onyejiaku/custom-strapi-plugin/issues).
Include your Strapi and Node.js versions, the platform involved, and the error message
shown in the admin or the Strapi logs. Please don't paste API keys or tokens.

## License

MIT

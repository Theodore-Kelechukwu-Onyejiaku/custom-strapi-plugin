<p align="left"><img src="./logo.svg" width="72" alt="Content Publisher"></p>

# Content Publisher

Publish Strapi content to **Dev.to**, **Medium** and **Bluesky** from the admin panel, and
keep track of where each entry ended up.

You choose which collection types are publishable, map each platform's fields onto your own
attributes, and publish from either the plugin's page or the Content Manager's edit view.

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

Three actions, under *Settings → Roles*:

| Action | Grants |
| --- | --- |
| `Access the publishing table` | the menu link and the publishing table |
| `Access the publishing settings` | viewing the settings page |
| `Change the publishing settings` | saving mappings and credentials |

Settings are kept separate from the table on purpose: seeing what you can publish should not
imply seeing where it goes or which credentials exist. New actions are not granted to existing
roles automatically — Super Admin has them, everyone else needs them ticked.

## Adding a platform

1. Describe the API's fields in `server/src/platforms/<name>.ts`.
2. Add it to `PLATFORMS` in `server/src/platforms/index.ts`.
3. Write the request in `server/src/services/publishers/`.

The settings page builds itself from that definition, so no admin code changes.

## Known limitations

- **Medium's write API is archived.** It only ever supported creating posts — no updates, no
  deletes, no stats — and may reject requests outright. Test the connection before relying
  on it.
- **Bluesky posts are capped** at 300 graphemes and 3,000 UTF-8 bytes. Longer text is trimmed
  on a grapheme boundary, and a link card points back at the original.
- **One tracked entry per document.** Localised entries are not yet handled separately.

## License

MIT

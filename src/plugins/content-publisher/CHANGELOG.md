# Changelog

All notable changes to `content-publisher`. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [2.0.0] - 2026-11-01

### Breaking

- **Publishing and deleting have their own permissions.** "Publish posts to platforms" and
  "Delete posts from the publishing table" used to be part of "Access the publishing
  table". Roles other than Super Admin can only view until those boxes are ticked. The chat
  is not given the publish tool for a role without "Publish posts to platforms".
- **Each MCP tool now has its own permission.** `content_publisher_list_posts`,
  `content_publisher_list_platforms` and `content_publisher_publish_post` used to sit behind
  "Access the publishing table". They now each have a checkbox under
  Plugins → Content Publisher → **AI tools**. Admin tokens and roles see no tools until those
  boxes are ticked.
- **The publishing table's routes require a logged-in admin.** `/posts`, `/single-post`,
  `/delete-post` and the `/publish-to-*` routes were open (`auth: false`). They now need the
  "Access the publishing table" permission, like the rest of the plugin.
- **Post routes follow REST style, with one publish route.** The server loads the post by
  its id instead of trusting the post sent in the request body.

  | Before | Now |
  | --- | --- |
  | `GET /single-post?contentType=…&entryId=…` | `GET /posts/by-entry?contentType=…&entryId=…` |
  | `DELETE /delete-post?postId=…` | `DELETE /posts/:id` |
  | `POST /publish-to-devto` (and one per platform), post in body | `POST /posts/:id/publish/:platform`, no body |

  `GET /posts` is unchanged.
- **The MCP `content_publisher_list_posts` result** now also includes each post's `entryId`.
- **Plugin config is validated at startup.** Unknown keys under
  `'content-publisher': { config: … }` now stop Strapi with an error instead of being ignored.

### Added

- **Model picker in the chat.** Editors choose Claude Haiku 4.5, Haiku 5.5, Sonnet 5.5 or
  Opus 5.5. The default is unchanged: `ANTHROPIC_MODEL`, or Claude Haiku 4.5.

- **Public read-only API:** `GET /api/content-publisher/posts` and
  `GET /api/content-publisher/posts/by-entry`, returning published entries and their
  platform links. Off until granted under Users & Permissions or on an API token.

- Unit tests with Vitest (`npm test`), starting with the chat's model allowlist.
- A 160×160 `logo.png` for the Strapi Marketplace.
- Admin UI text is translatable through `admin/src/translations/en.json`.

### Fixed

- **Drafts could be published to platforms** from the edit view, and a published entry with
  unsaved edits sent those edits instead of the live version. Publishing now refuses drafts
  and always sends the published version.
- A failed publish from the edit view showed no message. It now shows the same error
  toast as the publishing table.

### Changed

- Built and tested against Strapi 5.60.0. Still works with Strapi 5.54 and later.
- `@strapi/design-system` and `@strapi/icons` moved from 2.0 release candidates to 2.2.
- `@strapi/sdk-plugin` is no longer a peer dependency, so installing the plugin no longer
  pulls it into your app.

### Security

- Dependencies updated so `npm audit --omit=dev` reports no vulnerabilities. `zod` is now a
  direct dependency at 4.6.7 or later, because the AI SDK packages only list it as a peer
  and npm had resolved it to a vulnerable 4.4.

## [1.0.0]

- First release on npm: publish to Dev.to, Medium, Bluesky, LinkedIn and Facebook, per-platform
  field mapping, the publishing table, search, pagination and delete.

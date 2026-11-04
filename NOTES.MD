# content-publisher — architecture map

Orientation doc, written ahead of adding features. No code changes proposed here.

## Context

`content-publisher` is a local Strapi 5 plugin at `src/plugins/content-publisher`, enabled in
`config/plugins.ts` via `resolve: './src/plugins/content-publisher'`. It lets an editor push a
`Blog` entry out to Medium and Dev.to from the admin panel, and tracks where each entry was
published. Goal is eventually to ship it to the Strapi Marketplace, and to grow it to more
platforms (`CLAUDE.MD` names daily.dev).

Recent commit arc — pagination → search → delete — so the work so far has been building out the
posts table.

## Data model

Host app (`src/api/`), **not** part of the plugin:

- `api::blog.blog` — `title` (string), `content` (richtext), `canonicalUrl` (string),
  `tags` (oneToMany → `api::tag.tag`), `postBanner` (media), `slug` (uid), and
  `post` (oneToOne → `plugin::content-publisher.post`, `mappedBy: "blog"`)
- `api::tag.tag` — `blogTag` (string)

Plugin (`server/src/content-types/post.ts`):

- `plugin::content-publisher.post` — declares **only** `mediumLink` (text). `draftAndPublish: false`.

The plugin's post row is a *tracking record*: one per blog, holding the two published URLs.

## Request flow

```
admin component (raw axios, relative URL)
  └─> /content-publisher/*
        └─> server/src/routes/admin.ts        (type: 'admin', auth: false on all 6)
              └─> controllers/controller.ts   (thin passthrough, no validation)
                    └─> services/service.ts   (all logic lives here)
                          ├─> strapi.documents('plugin::content-publisher.post')
                          └─> axios -> dev.to / Medium REST APIs
```

Six admin routes: `GET /posts`, `GET /single-post`, `GET /search`, `POST /publish-to-medium`,
`POST /publish-to-devto`, `DELETE /delete-post`. Plus one content-api route `GET /blogs` whose
handler `getBlogs` is an empty function.

`server/src/register.ts` subscribes to `afterCreate` on `api::blog.blog` and auto-creates the
tracking post. There is no `afterDelete`.

## Admin UI

- `admin/src/index.tsx` — `addMenuLink` → `pages/App.tsx`; `bootstrap` injects `InjectedComponent`
  into content-manager `editView` / `right-links`
- `pages/App.tsx` — `Routes`; index → `HomePage`, `*` → `Page.Error`
- `pages/HomePage.tsx` — bare `Main` + heading + `<PublishingTable />`
- `components/PublishingTable.tsx` — owns all state (posts, pageCount, currentPage, searchValue)
  and all three read/delete calls; renders `Searchbar` + `Table` + `Pagination`
- `components/PublishButton.tsx` — shared by the table and the injected component; publishes,
  then `window.location.reload()`
- `components/InjectedComponent.tsx` — early-returns unless `slug === 'api::blog.blog'`

## Landmines to know about before adding features

Ordered by how likely they are to bite during feature work.

1. **`post.ts` is missing `devToLink` and the `blog` relation.** Both are used throughout
   (`register.ts`, the service's `populate`/`update`, the whole table). The relation works only
   because the *blog* side declares it. `devToLink` writes are cast `as any` to get past the
   compiler. **Any new field — a new platform's link, a status, a timestamp — must be declared
   here or it will not persist.**
2. **`server/src/controllers/test.ts`** is a near-duplicate of `controller.ts`, not registered in
   `controllers/index.ts`. Dead file; easy to edit the wrong one.
3. **`service.ts:41,92` destructure `banner` from `post.blog`,** but the blog field is
   `postBanner`. Always `undefined` — Medium posts get `![Image banner](undefined)`.
4. **`postPerPage` is defined twice** — `service.ts:4` and `PublishingTable.tsx` `postsPerPage`.
   They must be changed together.
5. **`routes/admin.ts:1`** — `import policies from 'src/policies'`, non-relative and unused.
6. **`auth: false` on all six admin routes,** because the admin components use raw `axios` rather
   than `useFetchClient` and so send no JWT. Unauthenticated delete + publish.
7. `getSearchQuery` counts by fetching every matching row and taking `.length`.
8. `start` reaches the service as a string from the query string, never parsed.
9. `PublishingTable` has no loading state — renders "Nothing Found!" on every mount before the
   first fetch resolves.
10. `useEffect(..., [])` in `PublishingTable` reads `currentPage`.
11. `PublishingTable.tsx` hardcodes `http://localhost:1337` in the content-manager link.
12. `axios` is imported by three admin files and the service but is **not** in the plugin's
    `package.json` dependencies — works only via host hoisting.
13. `translations/en.json` is `{}`; `getTranslation` is imported in `index.tsx` but never called.
    Every UI string is hardcoded.
14. Plugin devDeps pin React 19 / react-router 7 / design-system `2.0.0-rc.14`, while the host runs
    React 18.3.1 / react-router 6.30.4 / design-system 2.2.4. The host's copies win at runtime.
15. Worth verifying independently: Medium retired its public write API / integration tokens some
    time ago. If `publishPostToMedium` no longer works against a fresh token, that is upstream,
    not a bug in this code.

## Marketplace-specific gaps (separate from feature work)

- `server/src/register.ts:6` hardcodes `models: ['api::blog.blog']`, and the service depends on
  that exact field shape. An installer without an `api::blog.blog` collection gets a plugin that
  silently does nothing. This is the deepest blocker.
- `package.json`: `version: "0.0.0"`, empty `keywords`, no `repository`/`bugs`/`homepage`,
  `displayName` is `"content-publisher"` rather than a human-readable name.
- `README.md` is three lines and does not document the required `DEVTO_API_KEY`,
  `MEDIUM_USER_ID`, `MEDIUM_API_TOKEN` env vars.
- No permissions: `registerPlugin` declares none, no `permissions.ts`, no `Page.Protect`.
- `.env` is correctly gitignored and untracked — no secrets committed.

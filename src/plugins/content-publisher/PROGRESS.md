# content-publisher — progress tracker

Running checklist of fixes and features. Ordered by dependency: earlier items unblock later ones.

Tick items as they land. Add new findings to the relevant phase rather than the bottom.

---

## Orientation

**What it does.** Pushes a `Blog` entry out to Medium and Dev.to from the admin panel, and keeps a
tracking record (`plugin::content-publisher.post`) of where each one landed.

**Request flow.**

```
admin component (raw axios)
  -> /content-publisher/*
    -> server/src/routes/admin.ts        (type: 'admin', auth: false on all six)
      -> server/src/controllers/controller.ts   (thin passthrough, no validation)
        -> server/src/services/service.ts       (all logic lives here)
          -> strapi.documents(...) + axios to dev.to / Medium
```

**Two publish surfaces**, both driving `PublishButton`:

1. the plugin page (`HomePage` -> `PublishingTable`)
2. an injected component in the content-manager edit view (`InjectedComponent`)

**Data model.** Host app owns `api::blog.blog` (`title`, `content`, `canonicalUrl`, `tags` ->
`api::tag.tag`, `postBanner` media, `slug`) and `api::tag.tag` (`blogTag`). The plugin owns
`plugin::content-publisher.post`, one row per blog, holding the published URLs.
`server/src/register.ts` creates that row on blog `afterCreate`.

---

## Phase 1 — foundation

Small, high-leverage. Each one unblocks later work.

- [x] **1. Declare `devToLink` + `blog` on `post.ts`**
  Why: everything else depends on it — adding a platform means adding a link field here. Also
  removes the `as any` casts, restoring type-checking across the service.
  Files: `server/src/content-types/post.ts`, `server/src/services/service.ts`
  Risk: none — the DB already has the `dev_to_link` column and the `posts_blog_lnk` table.

- [ ] **2. Fix the banner: `banner` -> `postBanner`**
  Why: Medium and Dev.to both currently receive `undefined` for the image. Two-part —
  `postBanner` is a *media object, not a string*, and it isn't in the `populate` at all. Needs
  populating, then reading `.url` off it.
  Files: `server/src/services/service.ts` (:41, :92 and the `populate` blocks)

- [ ] **3. Remove dead code**
  Why: `controllers/test.ts` is a near-duplicate of `controller.ts` and isn't registered — easy to
  edit the wrong file. `routes/admin.ts:1` has an unused non-relative `import policies from
  'src/policies'`.
  Files: delete `server/src/controllers/test.ts`; edit `server/src/routes/admin.ts`

- [ ] **4. Declare `axios` as a dependency**
  Why: imported by three admin files and the service, but absent from the plugin's
  `package.json`. Resolves today only through host hoisting; would break on a real install.
  Files: `package.json`

## Phase 2 — correctness

- [ ] **5. Single source of truth for page size; parse `start` to int**
  Why: duplicated as `service.ts:4` `postPerPage` and `PublishingTable` `postsPerPage`; `start`
  arrives as a string from the query and is never parsed.
  Files: `server/src/services/service.ts`, `admin/src/components/PublishingTable.tsx`

- [ ] **6. `getSearchQuery` should use `count()`**
  Why: currently fetches every matching row just to take `.length`.
  Files: `server/src/services/service.ts`

- [x] **7. Add an `afterDelete` lifecycle**
  Why: deleting a blog orphans its tracking post row. Only `afterCreate` is subscribed.
  Files: `server/src/register.ts`

- [ ] **8. Loading state + `useEffect` deps in `PublishingTable`**
  Why: renders "Nothing Found!" on every mount before the first fetch resolves; the effect reads
  `currentPage` with an empty dep array.
  Files: `admin/src/components/PublishingTable.tsx`

- [ ] **9. Remove the hardcoded `http://localhost:1337`**
  Why: the content-manager link breaks in any non-local deployment.
  Files: `admin/src/components/PublishingTable.tsx`

- [x] **18. Plugin errors return a bare 500 instead of their message**
  Why: the plugin resolves its own `@strapi/utils` (5.6.0) while the host runs another
  (5.52.0), pulled in by the `@strapi/strapi` devDependency:

  ```
  node_modules/@strapi/utils                               5.52.0
  src/plugins/content-publisher/node_modules/@strapi/utils  5.6.0

  same class object?                 false
  instanceof host ApplicationError?  false
  ```

  Strapi's error middleware recognises its errors with `instanceof`. Across two copies that
  check fails, so it falls through to `strapi.log.error(error)` at
  `@strapi/core/dist/middlewares/errors.js:26` — where `strapi` is an undefined global. That
  line throws, the lines after it never run, and the caller gets a 500 with no body.

  Observed: a dev.to duplicate-title rejection ("Title has already been used in the last five
  minutes") reached the browser as a bare 500. Every `ValidationError` the settings service
  throws does the same, so a rejected mapping never reaches the page's error Alert.

  Fixed with option 1: `middlewares/plugin-errors.ts`, attached to every plugin route, matches
  on `error.name` instead of the class. Survives `npm install` and keeps working once the
  plugin is published. Verified: a publish with no entry attached now returns
  `400 {"error":{"name":"ApplicationError","message":"This record is not linked to an entry."}}`
  where it previously returned an empty 500.

  Concrete instance of the version skew noted at the bottom of this file.

## Phase 3 — security & Strapi conventions

- [ ] **10. `useFetchClient` + re-enable `auth`**
  Why: all six admin routes are `auth: false`, including `DELETE /delete-post` and both publish
  endpoints — unauthenticated callers can delete posts and publish to your accounts. Auth is off
  *because* the components use raw axios and send no JWT, so these must land together.
  Files: `admin/src/components/{PublishingTable,PublishButton,InjectedComponent}.tsx`,
  `server/src/routes/admin.ts`

- [x] **11. Plugin permissions**
  Three actions — `read`, `settings-read`, `settings-update` — registered in `bootstrap.ts`,
  enforced on the routes with `admin::hasPermissions`, and mirrored in the admin panel by
  the menu link, `Page.Protect` and `useRBAC`.
  Files: `server/src/permissions.ts`, `server/src/bootstrap.ts`, `server/src/routes/settings.ts`,
  `admin/src/permissions.ts`, `admin/src/index.tsx`, `admin/src/pages/App.tsx`

  Note: existing roles do **not** inherit new actions. Super Admin has them; anyone else
  needs them granted under *Settings > Roles* or the plugin disappears from their menu.

- [x] **19. Platform API keys in the admin panel**
  Encrypted with `admin::encryption`, write-only over the wire, overriding the env var of
  the same name. Needs `ENCRYPTION_KEY` set and read as `admin.secrets.encryptionKey`.
  See `logic.md`.
  Files: `server/src/services/credentials.ts`, `server/src/services/present-settings.ts`,
  `admin/src/components/settings/CredentialField.tsx`

## Phase 4 — UX & i18n

- [ ] **12. Rewrite `HomePage` onto the documented shell**
  Why: currently a bare `Main` with a hand-rolled heading. Should be `Layouts.Root` /
  `Page.Title` / `Layouts.Header` / `Layouts.Content`.
  Files: `admin/src/pages/HomePage.tsx`

- [ ] **13. i18n every string**
  Why: `translations/en.json` is `{}` and `getTranslation` is imported in `index.tsx` but never
  called. The plugin ships un-translatable.
  Files: `admin/src/translations/en.json` + all admin components

- [ ] **14. Replace `window.location.reload()` with a refetch**
  Why: publishing currently hard-reloads the whole admin panel.
  Files: `admin/src/components/PublishButton.tsx`

- [ ] **15. Delete confirmation + a11y on the Trash target**
  Why: one-click irreversible delete, on an icon with no role/tabIndex/aria-label.
  Files: `admin/src/components/PublishingTable.tsx`

## Phase 5 — marketplace

- [ ] **16. Decouple from `api::blog.blog`** — *substantially done; `register.ts` note below*
  Why: the deepest ship blocker. `register.ts:6` hardcodes `models: ['api::blog.blog']` and the
  service depends on that exact field shape, so an installer without that collection gets a plugin
  that silently does nothing. Needs plugin config for content-type + field mapping.
  Files: `server/src/register.ts`, `server/src/config/index.ts`, `server/src/services/service.ts`

  - [x] settings stored in the core store, with validation (`services/setting.ts`,
        `services/mapping-validator.ts`)
  - [x] platform definitions served to the admin panel (`server/src/platforms/`)
  - [x] settings page: pick collection types, map each platform's fields onto their attributes
  - [x] three authenticated settings routes, including `PUT /settings/platforms/:platform`
  - [x] `service.ts` publishes through the saved mapping (`services/publish.ts`,
        `services/resolve-fields.ts`), falling back to the old field names when nothing is saved
  - [ ] `register.ts` still hardcodes `models: ['api::blog.blog']`; it should subscribe to the
        saved `contentTypes` instead
  - [x] Medium has a platform definition, so it is mappable alongside Dev.to
  - [x] Bluesky added: platform definition, publisher, route, `blueskyLink` on the tracking
        post, and a shared `admin/src/components/platformTargets.ts` so the table and the
        content-manager panel both pick up new platforms automatically
  - [x] **the content type is free too.** The `blog` relation is replaced by
        `contentType` + `entryId` with a `title`/`entryUpdatedAt` snapshot; lifecycles follow
        the saved selection with no restart, and `services/backfill.ts` picks up entries that
        already existed. Verified against `api::content.content` as well as blogs.

  See `logic.md` for the stored shape and how to add a platform.

- [ ] **17. `package.json` metadata + real README**
  Why: `version: "0.0.0"`, empty `keywords`, no `repository`/`bugs`/`homepage`, `displayName` is
  the slug. README is three lines and doesn't document the required `DEVTO_API_KEY`,
  `MEDIUM_USER_ID`, `MEDIUM_API_TOKEN`.
  Files: `package.json`, `README.md`

---

## Notes / open questions

- **`/publish-targets` exists so the publish surfaces do not need `settings-read`.** When the
  settings routes were put behind RBAC, the content-manager panel still fetched `/settings`,
  which silently hid the panel from any editor without that action. Anything the table or the
  panel needs must go on `/publish-targets`, not `/settings`.

- **`src/extensions/content-publisher/content-types/post/schema.json` shadows the plugin's own
  `server/src/content-types/post.ts`.** Strapi merges the extension over the plugin schema, so
  the extension is what actually runs in this project — adding a field to `post.ts` alone has
  no effect, which is why `blueskyLink` needed adding in both places. The two already disagree:
  the extension declares `mediumLink`/`devToLink` as `string`, the plugin as `text`. A
  Marketplace installer gets the plugin's version, so these should be reconciled before
  shipping; left alone for now because changing the existing two is a column migration.

- **Medium API.** Medium retired public write access via integration tokens some time ago. If
  `publishPostToMedium` stops working against a freshly issued token, that is upstream, not a bug
  in this code. Worth confirming before building further on that path.
- **Version skew.** Plugin devDeps pin React 19 / react-router 7 / design-system `2.0.0-rc.14`,
  while the host runs React 18.3.1 / react-router 6.30.4 / design-system 2.2.4. The host's copies
  win at runtime, so the plugin is compiled against a different design-system than it executes
  with. Not urgent, but it will matter before publishing.
- **`logic.md`.** The plugin's `CLAUDE.MD` says to record additions there; the file has never
  existed. This tracker covers fixes — decide whether `logic.md` should exist separately as a
  feature/design log.

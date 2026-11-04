// services/publish-config.ts
//
// The constants the publishing path needs, including the fallback used before an editor
// has saved anything.

import type { FieldMap } from '../platforms';

export const POST_UID = 'plugin::content-publisher.post';

// platform key -> the tracking record field that holds its published URL
export const LINK_FIELDS: Record<string, string> = {
  devTo: 'devToLink',
  medium: 'mediumLink',
  bluesky: 'blueskyLink',
  linkedIn: 'linkedInLink',
  facebook: 'facebookLink',
};

// Populates every relation and media attribute one level down when an entry is fetched for
// publishing. Broad on purpose: which attributes matter is decided by the editor's mapping,
// so naming them here would put the old hardcoding back.
export const ENTRY_POPULATE = '*';

// The one content type this plugin used to be welded to. It is no longer the reference —
// tracking records carry their own `contentType` — but the fallback mapping below only makes
// sense for it, so the uid is still needed to decide when that fallback applies.
export const BLOG_UID = 'api::blog.blog';

// Used when `api::blog.blog` has nothing mapped, so an install that upgrades without opening
// the settings page keeps publishing exactly as it did before settings existed. Any other
// content type has no such history, so it must be mapped explicitly.
export const LEGACY_MAPS: Record<string, FieldMap> = {
  devTo: {
    title: 'title',
    body_markdown: 'content',
    canonical_url: 'canonicalUrl',
    main_image: 'postBanner',
    tags: 'tags',
    tags__item: 'blogTag',
    description: 'content',
  },
  bluesky: {
    // the title makes a better 300-grapheme post than the body would
    text: 'title',
    uri: 'canonicalUrl',
    title: 'title',
    description: 'content',
    thumb: 'postBanner',
  },
  linkedIn: {
    commentary: 'title',
    source: 'canonicalUrl',
    title: 'title',
    description: 'content',
  },
  facebook: {
    message: 'title',
    link: 'canonicalUrl',
  },
  medium: {
    title: 'title',
    content: 'content',
    canonicalUrl: 'canonicalUrl',
    coverImage: 'postBanner',
    tags: 'tags',
    tags__item: 'blogTag',
  },
};

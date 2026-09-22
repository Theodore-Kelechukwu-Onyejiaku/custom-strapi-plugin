// platforms/bluesky.ts
//
// What the Bluesky (AT Protocol) API expects. Unlike Dev.to and Medium this is not a
// blogging platform — you cannot cross-post an article body. A post is at most 300
// graphemes, so the useful shape is a short line of text plus a link card pointing back at
// the original. https://bsky.network/docs/bluesky-api

import type { Platform } from './types';

const bluesky: Platform = {
  key: 'bluesky',
  label: 'Bluesky',
  // An app password from Settings > App Passwords, never the account password.
  envVars: ['BLUESKY_IDENTIFIER', 'BLUESKY_APP_PASSWORD'],
  fields: [
    {
      key: 'text',
      label: 'Post text',
      required: true,
      accepts: ['string', 'text', 'richtext'],
      hint: 'Trimmed to Bluesky’s 300-grapheme limit. A title usually reads better than a body.',
    },
    {
      key: 'uri',
      label: 'Link',
      required: true,
      accepts: ['string', 'text', 'uid'],
      hint: 'What the link card points at. Without it the post goes out as plain text.',
    },
    { key: 'title', label: 'Card heading', required: false, accepts: ['string', 'text'] },
    {
      key: 'description',
      label: 'Card summary',
      required: false,
      accepts: ['string', 'text', 'richtext'],
    },
    {
      key: 'thumb',
      label: 'Card image',
      required: false,
      accepts: ['media'],
      hint: 'Skipped if larger than 1MB, which is the lexicon’s cap for a card thumbnail.',
    },
  ],
  fixedOptions: {
    service: 'https://bsky.social',
    langs: ['en'],
  },
};

export default bluesky;

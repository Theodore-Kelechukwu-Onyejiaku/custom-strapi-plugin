// platforms/devto.ts
//
// What the dev.to API expects. Fields and required flags follow the createArticle body:
// https://developers.forem.com/api/v0#tag/articles/operation/createArticle

import type { Platform } from './types';

const devTo: Platform = {
  key: 'devTo',
  label: 'Dev.to',
  envVars: ['DEVTO_API_KEY'],
  fields: [
    { key: 'title', label: 'Title', required: true, accepts: ['string', 'text'] },
    {
      key: 'body_markdown',
      label: 'Content',
      required: true,
      accepts: ['string', 'text', 'richtext'],
      hint: 'Front matter inside this field overrides the values mapped below.',
    },
    {
      key: 'canonical_url',
      label: 'Canonical URL',
      required: false,
      accepts: ['string', 'text', 'uid'],
    },
    { key: 'main_image', label: 'Cover image', required: false, accepts: ['media'] },
    {
      key: 'tags',
      label: 'Tags',
      required: false,
      accepts: ['relation'],
      hint: 'Pick the relation, then which of its fields holds the tag text.',
    },
    { key: 'description', label: 'Description', required: false, accepts: ['string', 'text'] },
  ],
};

export default devTo;

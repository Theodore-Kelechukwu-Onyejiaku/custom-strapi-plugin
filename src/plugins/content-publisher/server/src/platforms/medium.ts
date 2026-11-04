// platforms/medium.ts
//
// What the Medium API expects. Fields follow the createPost request body:
// https://github.com/Medium/medium-api-docs#33-posts
//
// Medium retired public write access via integration tokens some time ago. The mapping
// here is still correct; whether a freshly issued token is accepted is upstream of us.

import type { Platform } from './types';

const medium: Platform = {
  key: 'medium',
  label: 'Medium',
  envVars: ['MEDIUM_USER_ID', 'MEDIUM_API_TOKEN'],
  fields: [
    { key: 'title', label: 'Title', required: true, accepts: ['string', 'text'] },
    {
      key: 'content',
      label: 'Content',
      required: true,
      accepts: ['string', 'text', 'richtext'],
      hint: 'Sent as markdown, under a heading built from the title.',
    },
    {
      key: 'canonicalUrl',
      label: 'Canonical URL',
      required: false,
      accepts: ['string', 'text', 'uid'],
    },
    {
      key: 'coverImage',
      label: 'Cover image',
      required: false,
      accepts: ['media'],
      hint: 'Medium has no cover field, so this is prepended to the content as an image.',
    },
    {
      key: 'tags',
      label: 'Tags',
      required: false,
      accepts: ['relation'],
      hint: 'Pick the relation, then which of its fields holds the tag text.',
    },
  ],
};

export default medium;

// platforms/facebook.ts
//
// What the Graph API expects for a link post on a Facebook Page.
// https://developers.facebook.com/docs/pages-api/posts
//
// Pages only. Meta removed posting to personal profiles from the API in 2018, so the editor
// clicks Connect, signs in with Facebook, and picks one of the Pages they manage. The envVars
// are the Meta app's id and secret, read from .env only.

import type { Platform } from './types';

const facebook: Platform = {
  key: 'facebook',
  label: 'Facebook',
  envVars: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'],
  oauth: { scopes: ['pages_show_list', 'pages_manage_posts', 'pages_read_engagement'] },
  fields: [
    {
      key: 'message',
      label: 'Post text',
      required: true,
      accepts: ['string', 'text', 'richtext'],
    },
    {
      key: 'link',
      label: 'Link',
      required: true,
      accepts: ['string', 'text', 'uid'],
      hint: 'Facebook builds the preview card from the page’s Open Graph tags.',
    },
  ],
};

export default facebook;

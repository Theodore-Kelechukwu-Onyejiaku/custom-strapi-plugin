// platforms/linkedin.ts
//
// What the LinkedIn Posts API expects for an article share on a member's own feed.
// https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api
//
// Not an API key platform: the editor clicks Connect and signs in with LinkedIn. The envVars
// below are the LinkedIn app's credentials and are read from .env only. The app needs the
// "Share on LinkedIn" and "Sign In with LinkedIn using OpenID Connect" products enabled.

import type { Platform } from './types';

const linkedIn: Platform = {
  key: 'linkedIn',
  label: 'LinkedIn',
  envVars: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
  oauth: { scopes: ['openid', 'profile', 'w_member_social'] },
  fields: [
    {
      key: 'commentary',
      label: 'Post text',
      required: true,
      accepts: ['string', 'text', 'richtext'],
      hint: 'Trimmed to LinkedIn’s 3,000-character limit.',
    },
    {
      key: 'source',
      label: 'Link',
      required: true,
      accepts: ['string', 'text', 'uid'],
      hint: 'LinkedIn does not scrape the link, so the heading and summary below form the card.',
    },
    { key: 'title', label: 'Card heading', required: true, accepts: ['string', 'text'] },
    {
      key: 'description',
      label: 'Card summary',
      required: false,
      accepts: ['string', 'text', 'richtext'],
    },
  ],
};

export default linkedIn;

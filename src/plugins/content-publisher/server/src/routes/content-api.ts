// routes/content-api.ts
//
// The public, read-only content API, served at /api/content-publisher/…. A frontend uses it
// to show "Also on Dev.to / Medium" links under a post.
//
// No `auth: false`: Users & Permissions decides who may call these. They are granted to no
// one until an admin ticks Posts → find / findByEntry for the Public role or an API token.
// Publishing, deleting and settings are deliberately admin-only (routes/admin.ts).

import { middlewares } from './can';

const config = { policies: [], middlewares };

export default [
  {
    method: 'GET',
    path: '/posts',
    handler: 'posts.find',
    config,
  },
  {
    method: 'GET',
    path: '/posts/by-entry',
    handler: 'posts.findByEntry',
    config,
  },
];

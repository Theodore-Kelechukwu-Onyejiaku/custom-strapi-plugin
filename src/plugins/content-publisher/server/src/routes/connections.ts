// routes/connections.ts
//
// Signing in to LinkedIn and Facebook. Everything here is behind `settings-update` except
// the callback: LinkedIn or Facebook is what calls that, in the popup, carrying no admin
// token. The one-time `state` (services/oauth/state.ts) is what guards it instead.

import { SETTINGS_UPDATE } from '../permissions';
import { can, middlewares } from './can';

export default [
  {
    // a POST because it creates the one-time state
    method: 'POST',
    path: '/settings/platforms/:platform/connect',
    handler: 'connection.start',
    config: can(SETTINGS_UPDATE),
  },
  {
    method: 'GET',
    path: '/connect/:platform/callback',
    handler: 'connection.callback',
    config: { auth: false, policies: [], middlewares },
  },
  {
    method: 'DELETE',
    path: '/settings/platforms/:platform/connection',
    handler: 'connection.disconnect',
    config: can(SETTINGS_UPDATE),
  },
  {
    method: 'PUT',
    path: '/settings/platforms/:platform/connection/page',
    handler: 'connection.selectPage',
    config: can(SETTINGS_UPDATE),
  },
];

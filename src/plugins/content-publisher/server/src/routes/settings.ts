// routes/settings.ts
//
// Settings decide what gets published where and hold the platform API keys, so these are
// behind real RBAC actions rather than `isAuthenticatedAdmin`, which only means "some
// admin is logged in" and would let any Author read the credential summary.

import { READ, SETTINGS_READ, SETTINGS_UPDATE } from '../permissions';

const can = (action: string) => ({
  policies: [
    'admin::isAuthenticatedAdmin',
    { name: 'admin::hasPermissions', config: { actions: [action] } },
  ],
  // so a rejected mapping says which attribute was wrong, rather than 500 (item 18)
  middlewares: ['plugin::content-publisher.plugin-errors'],
});

export default [
  {
    method: 'GET',
    path: '/settings',
    handler: 'setting.find',
    config: can(SETTINGS_READ),
  },
  {
    // only `read`: the publish surfaces need this, and they are shown to editors who are
    // not allowed to open the settings page
    method: 'GET',
    path: '/publish-targets',
    handler: 'setting.findTargets',
    config: can(READ),
  },
  {
    method: 'PUT',
    path: '/settings/content-types',
    handler: 'setting.updateContentTypes',
    config: can(SETTINGS_UPDATE),
  },
  {
    method: 'PUT',
    path: '/settings/platforms/:platform',
    handler: 'setting.updatePlatform',
    config: can(SETTINGS_UPDATE),
  },
  {
    method: 'PUT',
    path: '/settings/platforms/:platform/enabled',
    handler: 'setting.updateEnabled',
    config: can(SETTINGS_UPDATE),
  },
  {
    // a POST because it calls out to the platform, even though it changes nothing here
    method: 'POST',
    path: '/settings/platforms/:platform/test',
    handler: 'setting.testPlatform',
    config: can(SETTINGS_UPDATE),
  },
];

// permissions.ts
//
// The plugin's RBAC actions, registered in bootstrap.ts and referenced by routes/settings.ts.
//
// `settings-read` is deliberately separate from `read`: the settings payload describes where
// your content goes and which credentials are configured, so seeing the publishing table
// should not imply seeing that.
//
// Dashes, not dots. useRBAC names its allowedActions from the *last dot-segment* of the
// action, split on dashes — so `settings.update` would arrive as `canUpdate` and
// `settings.read` would collide with `read` as `canRead`. `settings-update` gives the
// `canSettingsUpdate` the admin panel actually checks.

export const ACTIONS = [
  {
    section: 'plugins',
    displayName: 'Access the publishing table',
    uid: 'read',
    pluginName: 'content-publisher',
  },
  {
    section: 'plugins',
    displayName: 'Access the publishing settings',
    uid: 'settings-read',
    pluginName: 'content-publisher',
  },
  {
    section: 'plugins',
    displayName: 'Change the publishing settings',
    uid: 'settings-update',
    pluginName: 'content-publisher',
  },
];

export const READ = 'plugin::content-publisher.read';
export const SETTINGS_READ = 'plugin::content-publisher.settings-read';
export const SETTINGS_UPDATE = 'plugin::content-publisher.settings-update';

// permissions.ts
//
// Mirrors server/src/permissions.ts. Used by the menu link, Page.Protect and useRBAC, so a
// role without the action never sees the link, the page, or the save buttons.
//
// The uids use dashes because useRBAC derives `allowedActions` from the last dot-segment of
// the action, split on dashes: `settings-update` -> `canSettingsUpdate`.

const pluginPermissions = {
  read: [{ action: 'plugin::content-publisher.read', subject: null }],
  publish: [{ action: 'plugin::content-publisher.publish', subject: null }],
  delete: [{ action: 'plugin::content-publisher.delete', subject: null }],
  settingsRead: [{ action: 'plugin::content-publisher.settings-read', subject: null }],
  settingsUpdate: [{ action: 'plugin::content-publisher.settings-update', subject: null }],
};

export default pluginPermissions;

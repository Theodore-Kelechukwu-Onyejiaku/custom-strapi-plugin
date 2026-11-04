// config/index.ts
//
// The plugin has no options of its own yet: platform keys come from .env and everything
// else is set on the settings page. The validator still runs at startup, so a typo in
// config/plugins.ts (e.g. `content-publisher: { config: { devto: … } }`) fails loudly
// instead of being ignored.

const ALLOWED_KEYS: string[] = [];

export default {
  default: {},
  validator(config: unknown) {
    if (typeof config !== 'object' || config === null || Array.isArray(config)) {
      throw new Error('[content-publisher] plugin config must be an object.');
    }

    const unknown = Object.keys(config).filter((key) => !ALLOWED_KEYS.includes(key));
    if (unknown.length > 0) {
      throw new Error(
        `[content-publisher] unknown config option(s): ${unknown.join(', ')}. ` +
          'Platform keys go in .env; everything else is on the settings page.'
      );
    }
  },
};

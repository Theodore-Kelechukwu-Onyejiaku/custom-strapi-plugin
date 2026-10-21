// controllers/setting.ts
//
// Thin passthrough to the setting service, which holds all the validation.

import type { Core } from '@strapi/strapi';

const settings = (strapi: Core.Strapi) => strapi.plugin('content-publisher').service('setting');

const settingController = ({ strapi }: { strapi: Core.Strapi }) => ({
  // everything the settings page needs: platforms, content types and saved settings
  async find(ctx) {
    ctx.body = await settings(strapi).find();
  },

  // the trimmed list the publishing table and content-manager panel need
  async findTargets(ctx) {
    ctx.body = await settings(strapi).publishTargets();
  },

  // save the collection types the editor publishes from
  async updateContentTypes(ctx) {
    ctx.body = await settings(strapi).setContentTypes(ctx.request.body?.contentTypes);
  },

  // save one platform's field mapping; the platform key comes from the route path
  async updatePlatform(ctx) {
    const { platform } = ctx.params;
    ctx.body = await settings(strapi).updatePlatform(platform, ctx.request.body?.mapping);
  },

  // check the credentials against the platform without publishing anything
  async testPlatform(ctx) {
    ctx.body = await settings(strapi).testPlatform(ctx.params.platform);
  },

  // turn one platform on or off
  async updateEnabled(ctx) {
    const { platform } = ctx.params;
    ctx.body = await settings(strapi).setEnabled(platform, ctx.request.body?.enabled);
  },
});

export default settingController;

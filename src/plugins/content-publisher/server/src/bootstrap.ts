import type { Core } from '@strapi/strapi';

import { ACTIONS } from './permissions';
import { syncTrackingRecords } from './services/backfill';

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  // Without these the plugin's routes have nothing to check against, so they must be
  // registered before any request is served.
  await strapi.service('admin::permission').actionProvider.registerMany(ACTIONS);

  // entries that already existed when a collection type was selected have no tracking record
  await syncTrackingRecords(strapi);
};

export default bootstrap;

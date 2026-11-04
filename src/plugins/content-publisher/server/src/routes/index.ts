import admin from './admin';
import contentApi from './content-api';

export default {
  admin: {
    type: 'admin',
    routes: admin,
  },
  // public, read-only; see routes/content-api.ts
  'content-api': {
    type: 'content-api',
    routes: contentApi,
  },
};

'use strict';

import admin from './admin';
import contentApi from './contentApi';

export default {
  'content-api': {
    type: 'content-api',
    routes: [...contentApi],
  },
  admin: {
    type: 'admin',
    routes: [...admin],
  },
};

'use strict';

import admin from './admin';

export default {
  admin: {
    type: 'admin',
    routes: [...admin],
  },
};

import controller from './controller';

import setting from './setting';
import connection from './connection';
import chat from './chat';
import posts from './posts';

export default {
  controller,
  setting,
  connection,
  chat,
  // the public content API; shows as "Posts" under Users & Permissions
  posts,
};

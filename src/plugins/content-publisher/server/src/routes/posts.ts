// routes/posts.ts
//
// The publishing table's routes. Reading needs "Access the publishing table"; publishing and
// deleting each need their own permission on top. The admin calls them through
// useFetchClient, which sends the editor's admin JWT.

import { DELETE, PUBLISH, READ } from '../permissions';
import { can } from './can';

const config = can(READ);

export default [
  {
    method: 'GET',
    path: '/posts',
    handler: 'controller.getPosts',
    config,
  },
  {
    // the tracking post for one entry: ?contentType=api::blog.blog&entryId=<documentId>
    method: 'GET',
    path: '/posts/by-entry',
    handler: 'controller.getSinglePost',
    config,
  },
  {
    // one route for every platform: /posts/:id/publish/devTo, …/publish/medium, …
    method: 'POST',
    path: '/posts/:id/publish/:platform',
    handler: 'controller.publish',
    config: can(READ, PUBLISH),
  },
  {
    method: 'DELETE',
    path: '/posts/:id',
    handler: 'controller.deletePost',
    config: can(READ, DELETE),
  },
];

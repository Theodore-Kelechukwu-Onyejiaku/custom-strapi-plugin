// routes/posts.ts
//
// The publishing table's routes. `auth: false` throughout because the admin components
// still call these with raw axios and send no JWT — see PROGRESS.md item 10.
//
// `plugin-errors` turns this plugin's thrown errors into a readable response; without it they
// arrive as a bare 500 with no body (PROGRESS.md item 18).

const config = {
  policies: [],
  auth: false,
  middlewares: ['plugin::content-publisher.plugin-errors'],
};

export default [
  {
    method: 'GET',
    path: '/posts',
    handler: 'controller.getPosts',
    config,
  },
  {
    method: 'GET',
    path: '/single-post',
    handler: 'controller.getSinglePost',
    config,
  },
  {
    method: 'GET',
    path: '/search',
    handler: 'controller.getSearchQuery',
    config,
  },
  {
    method: 'POST',
    path: '/publish-to-medium',
    handler: 'controller.publishPostToMedium',
    config,
  },
  {
    method: 'POST',
    path: '/publish-to-devto',
    handler: 'controller.publishPostToDevTo',
    config,
  },
  {
    method: 'POST',
    path: '/publish-to-bluesky',
    handler: 'controller.publishPostToBluesky',
    config,
  },
  {
    method: 'POST',
    path: '/publish-to-linkedin',
    handler: 'controller.publishPostToLinkedIn',
    config,
  },
  {
    method: 'POST',
    path: '/publish-to-facebook',
    handler: 'controller.publishPostToFacebook',
    config,
  },
  {
    method: 'DELETE',
    path: '/delete-post',
    handler: 'controller.deletePost',
    config,
  },
];

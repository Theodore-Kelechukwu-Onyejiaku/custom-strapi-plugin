// routes/can.ts
//
// The route config shared by every admin route that sits behind an RBAC action.
// `plugin-errors` turns this plugin's thrown errors into a readable response rather than a
// bare 500 (PROGRESS.md item 18).

export const middlewares = ['plugin::content-publisher.plugin-errors'];

// Strapi's hasPermissions requires *every* action listed, so can(READ, PUBLISH) means both.
export const can = (...actions: string[]) => ({
  policies: [
    'admin::isAuthenticatedAdmin',
    { name: 'admin::hasPermissions', config: { actions } },
  ],
  middlewares,
});

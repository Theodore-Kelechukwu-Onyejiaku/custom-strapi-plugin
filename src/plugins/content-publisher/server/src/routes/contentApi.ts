export default [
  {
    method: 'GET',
    path: '/blogs',
    // name of the controller file & the method.
    handler: 'controller.getBlogs',
    config: {
      policies: [],
    },
  },
];

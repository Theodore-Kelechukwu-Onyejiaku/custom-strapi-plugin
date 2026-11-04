export default ({ env }) => [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    // Which sites may call the API from a browser. Set CORS_ORIGIN to your frontend's
    // domain(s) in production, comma-separated. Unset keeps Strapi's default (any origin).
    name: 'strapi::cors',
    config: {
      origin: env.array('CORS_ORIGIN', ['*']),
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

// middlewares/plugin-errors.ts
//
// Strapi's error middleware recognises its own errors with `instanceof`. This plugin resolves
// its own copy of @strapi/utils, so the classes it throws are different objects from the ones
// the host checks against: the check fails, the middleware falls through to a line that
// itself crashes, and the caller gets a bare 500 with no body. A perfectly good message like
// "Could not publish to Medium: Request failed with status code 429" only ever reached the
// terminal.
//
// Matching on `error.name` instead of the class sidesteps that entirely — every Strapi error
// class sets its own name — and the response is built in Strapi's own shape so the admin
// panel reads it exactly as it would any other error.

import type { Core } from '@strapi/strapi';

// Mirrors mapErrorsAndStatus in @strapi/core; anything else from that family is a 400.
const STATUS_BY_NAME: Record<string, number> = {
  UnauthorizedError: 401,
  ForbiddenError: 403,
  PolicyError: 403,
  NotFoundError: 404,
  PayloadTooLargeError: 413,
  RateLimitError: 429,
  NotImplementedError: 501,
};

const KNOWN = new Set([
  'ApplicationError',
  'ValidationError',
  'YupValidationError',
  'PaginationError',
  ...Object.keys(STATUS_BY_NAME),
]);

export default (_config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: any) => {
    try {
      await next();
    } catch (error: any) {
      const name = error?.name;
      const recognised = KNOWN.has(name);
      const status = recognised ? (STATUS_BY_NAME[name] ?? 400) : 500;

      // an unrecognised throw is a real bug, so it is logged and not echoed to the client
      if (!recognised) {
        strapi.log.error(error);
      }

      ctx.status = status;
      ctx.body = {
        data: null,
        error: {
          status,
          name: recognised ? name : 'InternalServerError',
          message: recognised ? error.message : 'Internal Server Error',
          details: error?.details ?? {},
        },
      };
    }
  };
};

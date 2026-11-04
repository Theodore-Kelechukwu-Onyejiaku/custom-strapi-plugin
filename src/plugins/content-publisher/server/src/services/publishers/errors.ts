import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

/**
 * Fails with the upstream message rather than the raw axios error.
 *
 * `error.response` is undefined for timeouts and connection failures, so reading
 * `error.response.data` there throws a TypeError that hides the real cause.
 */
export const publishFailed = (platform: string, error: any): never => {
  const detail =
    error?.response?.data?.error ??
    error?.response?.data?.message ??
    error?.message ??
    'unknown error';

  throw new ApplicationError(`Could not publish to ${platform}: ${detail}`);
};

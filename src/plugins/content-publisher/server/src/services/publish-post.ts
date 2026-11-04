// services/publish-post.ts
//
// The one way to publish a tracked post to a platform. The REST route, the MCP tool and the
// chat all end up here, so the checks below apply to every caller.
//
// The post is loaded by its id rather than taken from the request body, so a caller cannot
// point a publish at a different entry by sending its own `contentType` or `entryId`.

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

import { getPlatform } from '../platforms';
import { publishEntry } from './publish';
import { LINK_FIELDS, POST_UID } from './publish-config';
import { sendToDevTo } from './publishers/devto';
import { sendToMedium } from './publishers/medium';
import { sendToBluesky } from './publishers/bluesky';
import { sendToLinkedIn } from './publishers/linkedin';
import { sendToFacebook } from './publishers/facebook';

const { ApplicationError, NotFoundError } = errors;

// platform key -> the function that sends the request to that platform
const senders = (strapi: Core.Strapi) => ({
  devTo: sendToDevTo,
  medium: sendToMedium,
  bluesky: sendToBluesky(strapi),
  linkedIn: sendToLinkedIn,
  facebook: sendToFacebook,
});

export const publishPost = async (strapi: Core.Strapi, platformKey: string, postId: string) => {
  const platform = getPlatform(platformKey);
  const send = senders(strapi)[platformKey as keyof ReturnType<typeof senders>];
  if (!platform || !send) {
    throw new ApplicationError(`"${platformKey}" is not a known platform.`);
  }

  const post: any = await strapi.documents(POST_UID).findOne({ documentId: postId });
  if (!post) {
    throw new NotFoundError(`No post with id ${postId}.`);
  }

  // a draft is not something you can syndicate, the same rule the table applies
  if (!post.entryPublished) {
    throw new ApplicationError(`"${post.title}" is a draft. Publish it in Strapi first.`);
  }

  const existing = post[LINK_FIELDS[platformKey]];
  if (existing) {
    throw new ApplicationError(`"${post.title}" is already on ${platform.label}: ${existing}`);
  }

  const { url } = await publishEntry(strapi, post, platformKey, send);
  return { url, title: post.title as string };
};

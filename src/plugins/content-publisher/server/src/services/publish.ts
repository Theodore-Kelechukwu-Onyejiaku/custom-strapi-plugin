// services/publish.ts
//
// The publishing path, shared by every platform. Checks the platform is on and credentialed,
// resolves the entry and its mapping, sends it, then records the URL on the tracking record.

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

import { getPlatform } from '../platforms';
import { resolveFields } from './resolve-fields';
import { secretsFor } from './publish-secrets';
import { getSettings } from './settings-store';
import { POST_UID } from './publish-config';
import { resolveSource } from './publish-source';

const { ApplicationError } = errors;

type Send = (
  values: Record<string, any>,
  secrets: Record<string, string | undefined>
) => Promise<string>;

export const publishEntry = async (
  strapi: Core.Strapi,
  post: any,
  platformKey: string,
  linkField: 'devToLink' | 'mediumLink' | 'blueskyLink' | 'linkedInLink' | 'facebookLink',
  send: Send
) => {
  const platform = getPlatform(platformKey);
  if (!platform) {
    throw new ApplicationError(`"${platformKey}" is not a known platform.`);
  }

  const settings = await getSettings(strapi);

  // a missing flag means enabled, so an install that never opened the settings page still
  // publishes; only an explicit false turns a platform off
  if (settings.enabled?.[platformKey] === false) {
    throw new ApplicationError(`${platform.label} is turned off in the publishing settings.`);
  }

  // an API key, or for LinkedIn and Facebook the signed-in account's token
  const secrets = await secretsFor(strapi, settings, platform);

  const { uid, entry, fieldMap } = await resolveSource(strapi, post, platform, settings);
  const url = await send(resolveFields(strapi, uid, platform, fieldMap, entry), secrets);

  await strapi.documents(POST_UID).update({
    documentId: post.documentId,
    data: { [linkField]: url },
  });

  return { url };
};

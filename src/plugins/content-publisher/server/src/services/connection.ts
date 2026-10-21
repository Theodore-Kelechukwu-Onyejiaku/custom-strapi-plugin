// services/connection.ts
//
// The "Connect LinkedIn" / "Connect Facebook" flow, HubSpot style: the settings page asks for
// a sign-in URL, opens it in a popup, the provider redirects back to the callback route, and
// the token is stored. The steps live in oauth/flow.ts, storage in oauth/connections.ts.

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

import { getPlatform } from '../platforms';
import { getSettings, saveSettings } from './settings-store';
import { presentSettings } from './present-settings';
import { getProvider } from './oauth/providers';
import { startSignIn, finishSignIn } from './oauth/flow';
import { removeConnection } from './oauth/connections';

const { ValidationError } = errors;

const connectionService = ({ strapi }: { strapi: Core.Strapi }) => ({
  requireOAuth(platformKey: string) {
    const platform = getPlatform(platformKey);
    const provider = getProvider(platformKey);
    if (!platform?.oauth || !provider) {
      throw new ValidationError(`"${platformKey}" does not sign in with OAuth`);
    }
    return { platform, provider };
  },

  async start(platformKey: string) {
    const { platform, provider } = this.requireOAuth(platformKey);
    return startSignIn(strapi, platform, provider);
  },

  async finish(platformKey: string, query: Record<string, any>) {
    const { platform, provider } = this.requireOAuth(platformKey);
    return finishSignIn(strapi, platform, provider, query);
  },

  async disconnect(platformKey: string) {
    this.requireOAuth(platformKey);
    return presentSettings(strapi, await removeConnection(strapi, platformKey));
  },

  // Facebook only: post as a different one of the Pages the user granted. The page tokens
  // are already encrypted, so they are copied across as they are.
  async selectPage(platformKey: string, pageId: unknown) {
    this.requireOAuth(platformKey);
    const settings = await getSettings(strapi);
    const connection = settings.connections?.[platformKey];
    const page = connection?.pages?.find((one) => one.id === pageId);

    if (!connection || !page) {
      throw new ValidationError('That Page is not part of this connection');
    }

    const next = {
      ...connection,
      accountId: page.id,
      accountName: page.name,
      accessToken: page.accessToken,
    };
    const connections = { ...settings.connections, [platformKey]: next };
    return presentSettings(strapi, await saveSettings(strapi, { connections }));
  },
});

export default connectionService;

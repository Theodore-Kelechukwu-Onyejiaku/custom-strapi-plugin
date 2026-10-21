// services/oauth/connections.ts
//
// Saving, reading and summarising signed-in accounts. Tokens are encrypted the same way the
// API keys are (credentials.ts), and only this file ever decrypts them.

import type { Core } from '@strapi/strapi';

import type { Connection, Platform, Settings } from '../../platforms';
import { encryptValue } from '../credentials';
import { getSettings, saveSettings } from '../settings-store';
import type { RawConnection } from './providers';

const decrypt = (strapi: Core.Strapi, value: string): string | undefined =>
  (strapi.service('admin::encryption') as any)?.decrypt(value) || undefined;

export const saveConnection = async (strapi: Core.Strapi, key: string, raw: RawConnection) => {
  const connection: Connection = {
    ...raw,
    accessToken: encryptValue(strapi, raw.accessToken),
    pages: raw.pages?.map((page) => ({
      ...page,
      accessToken: encryptValue(strapi, page.accessToken),
    })),
    connectedAt: new Date().toISOString(),
  };

  const { connections } = await getSettings(strapi);
  return saveSettings(strapi, { connections: { ...connections, [key]: connection } });
};

export const removeConnection = async (strapi: Core.Strapi, key: string) => {
  const connections = { ...(await getSettings(strapi)).connections };
  delete connections[key];
  return saveSettings(strapi, { connections });
};

// The token and account id a publisher needs, or the reason there are none.
export const connectionSecrets = (strapi: Core.Strapi, settings: Settings, platform: Platform) => {
  const connection = settings.connections?.[platform.key];
  const where = 'in the publishing settings';

  if (!connection) {
    return { problem: `${platform.label} is not connected. Connect it ${where}.` };
  }
  if (connection.expiresAt && new Date(connection.expiresAt) < new Date()) {
    return { problem: `The ${platform.label} connection has expired. Reconnect it ${where}.` };
  }

  const token = decrypt(strapi, connection.accessToken);
  if (!token) return { problem: `Could not decrypt the ${platform.label} token. Reconnect it.` };

  return { secrets: { ACCESS_TOKEN: token, ACCOUNT_ID: connection.accountId } };
};

// What the admin panel sees: who is connected and until when. Never a token.
export const presentConnection = (connection?: Connection) =>
  connection
    ? {
        accountId: connection.accountId,
        accountName: connection.accountName,
        expiresAt: connection.expiresAt,
        connectedAt: connection.connectedAt,
        pages: connection.pages?.map(({ id, name }) => ({ id, name })),
      }
    : null;

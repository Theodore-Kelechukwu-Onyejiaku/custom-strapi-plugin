import type { Core } from '@strapi/strapi';
import axios from 'axios';

import { publishFailed } from '../errors';
import { createSession, SERVICE } from './session';
import { buildEmbed } from './embed';
import { fitToPost } from './text';

// createRecord answers with an at:// uri; the last segment is the rkey the web app uses.
const permalink = (did: string, uri: string) =>
  `https://bsky.app/profile/${did}/post/${uri.split('/').pop()}`;

// Curried because the thumbnail upload logs through strapi, which `send` does not receive.
export const sendToBluesky =
  (strapi: Core.Strapi) =>
  async (
    values: Record<string, any>,
    secrets: Record<string, string | undefined>
  ): Promise<string> => {
    const session = await createSession(secrets);
    const embed = await buildEmbed(strapi, session, values);

    const record = {
      $type: 'app.bsky.feed.post',
      text: fitToPost(String(values.text ?? '')),
      createdAt: new Date().toISOString(),
      langs: ['en'],
      ...(embed ? { embed } : {}),
    };

    try {
      const { data } = await axios.post(
        `${SERVICE}/xrpc/com.atproto.repo.createRecord`,
        { repo: session.did, collection: 'app.bsky.feed.post', record },
        { headers: { Authorization: `Bearer ${session.accessJwt}` } }
      );

      return permalink(session.did, data.uri);
    } catch (error) {
      return publishFailed('Bluesky', error);
    }
  };

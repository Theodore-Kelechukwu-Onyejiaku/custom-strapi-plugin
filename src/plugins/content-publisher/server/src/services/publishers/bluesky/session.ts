import axios from 'axios';

import { publishFailed } from '../errors';

// Bluesky's own PDS. A self-hosted one would need this configurable, which is not worth a
// required env var until somebody asks for it.
export const SERVICE = 'https://bsky.social';

export type Session = { accessJwt: string; did: string };

// Takes an app password (Settings > App Passwords), never the account password. The did it
// returns is the repo every later call writes to.
export const createSession = async (
  secrets: Record<string, string | undefined>
): Promise<Session> => {
  try {
    const { data } = await axios.post(`${SERVICE}/xrpc/com.atproto.server.createSession`, {
      identifier: secrets.BLUESKY_IDENTIFIER,
      password: secrets.BLUESKY_APP_PASSWORD,
    });

    return { accessJwt: data.accessJwt, did: data.did };
  } catch (error) {
    return publishFailed('Bluesky', error);
  }
};

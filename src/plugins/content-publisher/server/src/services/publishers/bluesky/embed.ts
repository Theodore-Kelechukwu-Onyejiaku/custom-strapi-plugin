import type { Core } from '@strapi/strapi';
import axios from 'axios';

import { SERVICE } from './session';
import type { Session } from './session';

// app.bsky.embed.external caps a card thumbnail at 1,000,000 bytes.
const MAX_THUMB_BYTES = 1000000;

// Fetches the mapped image and hands it to the PDS, which returns the blob reference the
// embed needs. A thumbnail is decoration, so anything that fails here is logged and the
// post still goes out.
const uploadThumb = async (strapi: Core.Strapi, session: Session, url: string) => {
  try {
    const image = await axios.get(url, { responseType: 'arraybuffer' });

    if (image.data.byteLength > MAX_THUMB_BYTES) {
      strapi.log.warn('[content-publisher] Bluesky card image is over 1MB, posting without it.');
      return undefined;
    }

    const { data } = await axios.post(`${SERVICE}/xrpc/com.atproto.repo.uploadBlob`, image.data, {
      headers: {
        Authorization: `Bearer ${session.accessJwt}`,
        'Content-Type': image.headers['content-type'] ?? 'image/jpeg',
      },
    });

    return data.blob;
  } catch (error) {
    strapi.log.warn('[content-publisher] Could not upload the Bluesky card image.');
    return undefined;
  }
};

// uri, title and description are all required by the lexicon, so the card is attached only
// when there is a link to point it at. Without one the post goes out as plain text.
export const buildEmbed = async (
  strapi: Core.Strapi,
  session: Session,
  values: Record<string, any>
) => {
  if (!values.uri) return undefined;

  const thumb = values.thumb ? await uploadThumb(strapi, session, values.thumb) : undefined;

  return {
    $type: 'app.bsky.embed.external',
    external: {
      uri: values.uri,
      title: values.title ?? '',
      description: values.description ?? '',
      ...(thumb ? { thumb } : {}),
    },
  };
};

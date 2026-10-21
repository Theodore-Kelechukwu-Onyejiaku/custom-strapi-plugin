// services/publishers/facebook.ts
//
// A link post on the connected Facebook Page. The Page token, not a user token, is what makes
// the post appear as the Page. https://developers.facebook.com/docs/pages-api/posts

import axios from 'axios';

import { publishFailed } from './errors';
import { GRAPH_URL } from '../oauth/facebook';

export const sendToFacebook = async (
  values: Record<string, any>,
  secrets: Record<string, string | undefined>
): Promise<string> => {
  try {
    const form = new URLSearchParams({
      message: String(values.message ?? ''),
      link: String(values.link ?? ''),
      access_token: secrets.ACCESS_TOKEN ?? '',
    });
    const { data } = await axios.post(`${GRAPH_URL}/${secrets.ACCOUNT_ID}/feed`, form);

    // the id comes back as "<pageId>_<postId>", which facebook.com resolves directly
    return `https://www.facebook.com/${data.id}`;
  } catch (error: any) {
    // Graph errors nest the message one level deeper than publishFailed looks
    const message = error?.response?.data?.error?.message;
    return publishFailed('Facebook', message ? new Error(message) : error);
  }
};

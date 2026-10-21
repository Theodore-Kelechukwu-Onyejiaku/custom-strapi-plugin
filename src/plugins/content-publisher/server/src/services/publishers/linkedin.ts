// services/publishers/linkedin.ts
//
// An article share on the connected member's feed, through the versioned Posts API.
// https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api

import axios from 'axios';

import { publishFailed } from './errors';

// LinkedIn supports each monthly version for about a year. Bump this when it is retired.
const LINKEDIN_VERSION = '202610';
const MAX_COMMENTARY = 3000;

// `commentary` is in LinkedIn's "little" text format, where these characters are markup. An
// unescaped one — a bracket in a title, say — can make LinkedIn drop the rest of the post.
const escapeLittle = (text: string) => text.replace(/[\\|{}@\[\]()<>#*_~]/g, '\\$&');

const toCommentary = (text: unknown) => {
  const plain = String(text ?? '').trim();
  const fitted = plain.length > MAX_COMMENTARY ? `${plain.slice(0, MAX_COMMENTARY - 1)}…` : plain;
  return escapeLittle(fitted);
};

export const sendToLinkedIn = async (
  values: Record<string, any>,
  secrets: Record<string, string | undefined>
): Promise<string> => {
  const description = values.description ? String(values.description).slice(0, 200) : undefined;
  const post = {
    author: `urn:li:person:${secrets.ACCOUNT_ID}`,
    commentary: toCommentary(values.commentary),
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    // the API does not scrape links, so the card is only what is sent here
    content: { article: { source: values.source, title: values.title, description } },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };

  try {
    const response = await axios.post('https://api.linkedin.com/rest/posts', post, {
      headers: {
        Authorization: `Bearer ${secrets.ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': LINKEDIN_VERSION,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    // a 201 with no body: the new post's URN is in this header
    const urn = response.headers['x-restli-id'];
    return `https://www.linkedin.com/feed/update/${urn}/`;
  } catch (error) {
    return publishFailed('LinkedIn', error);
  }
};

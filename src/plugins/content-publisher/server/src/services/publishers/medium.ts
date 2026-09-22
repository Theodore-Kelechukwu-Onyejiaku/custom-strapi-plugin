import axios from 'axios';

import { publishFailed } from './errors';

// Medium has no cover image field, so the mapped image is prepended to the markdown —
// which is why platforms/medium.ts describes `coverImage` as a content field, not a
// separate one the API would accept.
const buildContent = (values: Record<string, any>): string =>
  [
    `# ${values.title}`,
    values.coverImage && `![${values.title}](${values.coverImage})`,
    values.content,
  ]
    .filter(Boolean)
    .join('\n');

export const sendToMedium = async (
  values: Record<string, any>,
  secrets: Record<string, string | undefined>
): Promise<string> => {
  const payload = {
    title: values.title,
    content: buildContent(values),
    canonicalUrl: values.canonicalUrl,
    tags: values.tags ?? [],
    contentFormat: 'markdown',
    publishStatus: 'public',
  };

  try {
    const response = await axios.post(
      `https://api.medium.com/v1/users/${secrets.MEDIUM_USER_ID}/posts`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${secrets.MEDIUM_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data?.data?.url;
  } catch (error) {
    return publishFailed('Medium', error);
  }
};

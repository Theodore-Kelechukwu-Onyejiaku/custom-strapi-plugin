// More sample tutorials; see tutorials-data.ts.

import type { SeedTutorial } from './tutorials-data';

const img = (seed: string) => `![Cover](https://picsum.photos/seed/${seed}/1200/630)\n\n`;

export const MORE_TUTORIALS: SeedTutorial[] = [
  {
    headline: 'Render Strapi Rich Text in a React App',
    summary: 'Fetch a Markdown field from Strapi and render it safely with react-markdown.',
    body: `${img('react-richtext')}# Render Strapi Rich Text in a React App

\`\`\`bash
npm install react-markdown
\`\`\`

\`\`\`tsx
import Markdown from 'react-markdown';

export const Article = ({ body }: { body: string }) => <Markdown>{body}</Markdown>;
\`\`\`

\`react-markdown\` doesn't render raw HTML by default, so editor content can't inject scripts.`,
    difficulty: 'beginner',
    originalUrl: 'https://mystite.com/tutorials/render-strapi-rich-text-react',
    topics: ['react', 'markdown', 'webdev'],
    publish: true,
  },
  {
    headline: 'Lock Down a Strapi API with Roles and API Tokens',
    summary: 'Give your frontend read-only access with a scoped API token instead of Public.',
    body: `${img('api-tokens')}# Lock Down a Strapi API with Roles and API Tokens

1. Go to **Settings → API Tokens → Create new API Token**.
2. Choose **Custom**, and tick only \`find\` and \`findOne\` on the types you need.
3. Send it from your server, never the browser:

\`\`\`bash
curl -H "Authorization: Bearer $STRAPI_TOKEN" http://localhost:1337/api/recipes
\`\`\``,
    difficulty: 'intermediate',
    originalUrl: 'https://mystite.com/tutorials/strapi-roles-and-api-tokens',
    topics: ['security', 'strapi', 'api'],
    publish: true,
  },
  {
    headline: 'Schedule Posts with Strapi Cron Jobs',
    summary: 'Draft: publish entries automatically at a set time using config/cron-tasks.',
    body: `${img('cron-jobs')}# Schedule Posts with Strapi Cron Jobs

Work in progress. This entry is a draft, so it shouldn't appear in Content Publisher.`,
    difficulty: 'advanced',
    originalUrl: 'https://mystite.com/tutorials/schedule-posts-strapi-cron',
    topics: ['strapi', 'content'],
    publish: false,
  },
];

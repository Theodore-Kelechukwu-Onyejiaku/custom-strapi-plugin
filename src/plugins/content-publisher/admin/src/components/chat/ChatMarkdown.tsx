import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from '@strapi/design-system';

import { Prose } from './markdownStyles';

// The assistant's replies are Markdown. react-markdown turns them into elements (raw HTML in
// the text is ignored, so a blog post's contents cannot inject anything), and remark-gfm
// adds tables, strikethrough and bare URLs as links. The look is in markdownStyles.ts.

// Links open in a new tab, so following a published post's URL keeps the chat open
const components = {
  a: ({ href, children }: any) => (
    <Link href={href} isExternal>
      {children}
    </Link>
  ),
};

const ChatMarkdown = ({ text, streaming }: { text: string; streaming: boolean }) => (
  <Prose $streaming={streaming}>
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {text}
    </ReactMarkdown>
  </Prose>
);

export default ChatMarkdown;

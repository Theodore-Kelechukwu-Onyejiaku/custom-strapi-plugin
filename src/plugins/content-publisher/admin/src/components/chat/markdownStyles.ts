import styled from 'styled-components';

import { blocks, cursor } from './markdownBlocks';

// How the assistant's Markdown replies look. Colours come from the admin's theme, so
// replies match the rest of Strapi in light and dark mode. Code, quotes, tables and the
// streaming cursor are in markdownBlocks.ts.
export const Prose = styled.div<{ $streaming: boolean }>`
  font-size: 1.4rem;
  line-height: 2.2rem;
  color: ${({ theme }) => theme.colors.neutral800};
  overflow-wrap: anywhere;

  & > :first-child {
    margin-top: 0;
  }
  & > :last-child {
    margin-bottom: 0;
  }
  p,
  ul,
  ol,
  pre,
  table,
  blockquote {
    margin: 0 0 0.8rem;
  }
  ul,
  ol {
    padding-left: 2rem;
  }
  ul {
    list-style: disc;
  }
  ol {
    list-style: decimal;
  }
  li + li {
    margin-top: 0.4rem;
  }
  h1,
  h2,
  h3,
  h4 {
    font-size: 1.4rem;
    font-weight: 600;
    margin: 1.2rem 0 0.4rem;
  }
  strong {
    font-weight: 600;
  }
  em {
    font-style: italic;
  }

  ${blocks}
  ${({ $streaming }) => $streaming && cursor}
`;

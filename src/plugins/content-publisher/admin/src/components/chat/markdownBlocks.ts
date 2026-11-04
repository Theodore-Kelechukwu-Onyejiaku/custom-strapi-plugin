import { css } from 'styled-components';

import { blink } from './StatusText';

// Extra pieces of the reply styles in markdownStyles.ts: code, quotes and tables, and
// the blinking cursor.

export const blocks = css`
  code {
    font-family: monospace;
    font-size: 1.2rem;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    background: ${({ theme }) => theme.colors.neutral150};
  }
  pre {
    padding: 0.8rem;
    border-radius: 8px;
    overflow-x: auto;
    background: ${({ theme }) => theme.colors.neutral150};
  }
  pre code {
    padding: 0;
    background: none;
  }
  blockquote {
    padding-left: 1rem;
    border-left: 2px solid ${({ theme }) => theme.colors.neutral300};
    color: ${({ theme }) => theme.colors.neutral600};
  }
  table {
    border-collapse: collapse;
    display: block;
    overflow-x: auto;
  }
  th,
  td {
    padding: 0.4rem 0.8rem;
    border: 1px solid ${({ theme }) => theme.colors.neutral200};
    text-align: left;
  }
`;

// While the answer streams in, a blinking cursor follows the last word
export const cursor = css`
  & > p:last-child::after,
  & > :is(ul, ol):last-child > li:last-child::after {
    content: '▍';
    margin-left: 2px;
    color: ${({ theme }) => theme.colors.neutral600};
    animation: ${blink} 1s step-start infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }
`;

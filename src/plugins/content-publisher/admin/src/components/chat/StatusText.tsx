import styled, { keyframes } from 'styled-components';

// The small animations that show the assistant is busy, like ChatGPT, Claude and Gemini:
// a light sweeping across "Thinking…", and the blink of the cursor that follows a streaming
// answer (the cursor itself is drawn by ChatMarkdown.tsx).

const sweep = keyframes`
  from { background-position: 100% 0; }
  to { background-position: -100% 0; }
`;

export const blink = keyframes`
  50% { opacity: 0; }
`;

// Text with a shine moving across it, e.g. <StatusText>Thinking…</StatusText>
export const StatusText = styled.span`
  font-size: 1.4rem;
  line-height: 2rem;
  color: transparent;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.neutral500} 35%,
    ${({ theme }) => theme.colors.neutral800} 50%,
    ${({ theme }) => theme.colors.neutral500} 65%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  animation: ${sweep} 1.6s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

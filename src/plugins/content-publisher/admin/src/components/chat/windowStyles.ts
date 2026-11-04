import styled, { css } from 'styled-components';

// The chat window. Colours come from the admin theme.

// The window fades and rises into place when it opens. It stays in the page while closed
// (just invisible), so the conversation is kept.
export const Window = styled.div<{ $open: boolean }>`
  position: fixed;
  bottom: 96px;
  right: 24px;
  z-index: 5;
  width: 400px;
  max-width: calc(100vw - 48px);
  height: 620px;
  max-height: calc(100vh - 128px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.colors.neutral150};
  background: ${({ theme }) => theme.colors.neutral0};
  box-shadow: 0 12px 40px rgba(33, 33, 52, 0.18);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease,
    visibility 0.2s;

  ${({ $open }) =>
    $open
      ? css`
          opacity: 1;
          transform: none;
          visibility: visible;
        `
      : css`
          opacity: 0;
          transform: translateY(12px);
          visibility: hidden;
        `}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

import styled from 'styled-components';

// The round button in the bottom-right corner that opens and closes the chat.
export const Fab = styled.button`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 5;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background: ${({ theme }) => theme.colors.primary600};
  box-shadow: 0 6px 20px rgba(73, 69, 255, 0.35);
  transition:
    transform 0.15s ease,
    background 0.15s ease;

  svg {
    width: 2.4rem;
    height: 2.4rem;
  }
  svg path {
    fill: ${({ theme }) => theme.colors.neutral0};
  }

  &:hover {
    background: ${({ theme }) => theme.colors.primary700};
    transform: scale(1.05);
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary600};
    outline-offset: 3px;
  }
`;

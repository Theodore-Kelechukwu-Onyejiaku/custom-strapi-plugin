import styled from 'styled-components';

// The message box: a rounded field that grows with the text, and a round send/stop button.

export const Composer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 6px 6px 6px 14px;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  background: ${({ theme }) => theme.colors.neutral0};
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.primary600};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary100};
  }
`;

export const Field = styled.textarea`
  flex: 1;
  min-height: 2rem;
  max-height: 14rem;
  padding: 6px 0;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  font: inherit;
  font-size: 1.4rem;
  line-height: 2rem;
  color: ${({ theme }) => theme.colors.neutral800};

  &::placeholder {
    color: ${({ theme }) => theme.colors.neutral500};
  }
`;

export const RoundButton = styled.button`
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background: ${({ theme }) => theme.colors.primary600};

  svg {
    width: 1.4rem;
    height: 1.4rem;
  }
  svg path {
    fill: ${({ theme }) => theme.colors.neutral0};
  }

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary700};
  }
  &:disabled {
    cursor: default;
    background: ${({ theme }) => theme.colors.neutral200};
  }
`;

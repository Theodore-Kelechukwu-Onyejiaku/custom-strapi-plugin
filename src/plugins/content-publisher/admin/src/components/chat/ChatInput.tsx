import { useState, type ReactNode } from 'react';
import { Box, Flex, Typography } from '@strapi/design-system';
import { ArrowUp, Stop } from '@strapi/icons';

import { Composer, Field, RoundButton } from './composerStyles';
import { useAutoGrow } from '../../hooks/useAutoGrow';

type Props = { busy: boolean; onSend: (text: string) => void; onStop: () => void; picker: ReactNode };

// The message box at the bottom of the chat. Enter sends, Shift+Enter adds a line. While
// the assistant answers, the send button turns into a stop button. `picker` is the model
// picker, shown under the box.
const ChatInput = ({ busy, onSend, onStop, picker }: Props) => {
  const [input, setInput] = useState('');
  const field = useAutoGrow(input);

  const send = () => {
    const text = input.trim();
    if (!text || busy) return;
    onSend(text);
    setInput('');
  };

  return (
    <Box paddingTop={2} paddingBottom={3} paddingLeft={3} paddingRight={3}>
      <Composer>
        <Field
          ref={field}
          rows={1}
          aria-label="Message"
          placeholder="Ask about your posts or publish one…"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
        />
        {busy ? (
          <RoundButton type="button" aria-label="Stop" title="Stop" onClick={onStop}>
            <Stop />
          </RoundButton>
        ) : (
          <RoundButton
            type="button"
            aria-label="Send"
            title="Send"
            onClick={send}
            disabled={!input.trim()}
          >
            <ArrowUp />
          </RoundButton>
        )}
      </Composer>
      <Flex paddingTop={2} gap={2} justifyContent="space-between" alignItems="center">
        {picker}
        <Typography variant="pi" textColor="neutral500">
          Nothing is published until you approve it.
        </Typography>
      </Flex>
    </Box>
  );
};

export default ChatInput;

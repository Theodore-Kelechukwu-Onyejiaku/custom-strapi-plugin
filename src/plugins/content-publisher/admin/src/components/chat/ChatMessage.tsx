import { Box, Flex, Typography } from '@strapi/design-system';

import ChatMarkdown from './ChatMarkdown';
import CopyButton from './CopyButton';
import ToolCall from './ToolCall';
import { isToolPart } from './activity';

// The editor's message: a soft bubble on the right, plain text.
const UserMessage = ({ message }: any) => (
  <Flex justifyContent="flex-end">
    <Box
      maxWidth="85%"
      paddingTop={2}
      paddingBottom={2}
      paddingLeft={4}
      paddingRight={4}
      background="neutral150"
      style={{ borderRadius: '18px' }}
    >
      <Typography
        variant="omega"
        textColor="neutral800"
        style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
      >
        {message.parts.map((part: any) => (part.type === 'text' ? part.text : '')).join('')}
      </Typography>
    </Box>
  </Flex>
);

// The assistant's turn: no bubble, full width, like ChatGPT and Claude. Its parts — text
// and the tool calls it made along the way — appear in the order they happened. Once the
// answer is finished, a copy button sits underneath.
const ChatMessage = ({ message, streaming, onRespond }: any) => {
  if (message.role === 'user') return <UserMessage message={message} />;

  const lastIndex = message.parts.length - 1;
  const text = message.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text);

  return (
    <Flex direction="column" alignItems="stretch" gap={2}>
      {message.parts.map((part: any, index: number) => {
        if (part.type === 'text') {
          const live = streaming && index === lastIndex;
          return <ChatMarkdown key={index} text={part.text} streaming={live} />;
        }
        if (isToolPart(part)) {
          return <ToolCall key={index} part={part} onRespond={onRespond} />;
        }
        return null; // the model's reasoning and step markers are not shown
      })}
      {!streaming && text.length > 0 ? (
        <Flex>
          <CopyButton text={text.join('\n\n')} />
        </Flex>
      ) : null}
    </Flex>
  );
};

export default ChatMessage;

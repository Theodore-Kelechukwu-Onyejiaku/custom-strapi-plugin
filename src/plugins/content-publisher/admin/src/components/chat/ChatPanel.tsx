import { useEffect, useRef } from 'react';
import { Box, Flex, Typography } from '@strapi/design-system';

import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import Suggestions from './Suggestions';
import { StatusText } from './StatusText';
import { isThinking } from './activity';
import ModelPicker from './ModelPicker';
import { readError, usePublisherChat } from '../../hooks/usePublisherChat';
import { useChatModels } from '../../hooks/useChatModels';

// The whole chat window: header, conversation, "Thinking…" while the assistant works out
// its next move, any setup error (a missing API key, say), and the message box.
const ChatPanel = ({ onClose }: { onClose: () => void }) => {
  const { models, model, setModel } = useChatModels();
  const chat = usePublisherChat(model);
  const bottom = useRef<HTMLDivElement>(null);
  const busy = chat.status === 'submitted' || chat.status === 'streaming';

  // Keep the newest message in view as the answer streams in. A block body on purpose: an
  // effect's return value is its cleanup, and returning scrollIntoView's result made React
  // call a non-function ("destroy is not a function") on the next message.
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [chat.messages]);

  const respond = (id: string, approved: boolean) => chat.addToolApprovalResponse({ id, approved });
  const send = (text: string) => chat.sendMessage({ text });
  const picker = <ModelPicker models={models} value={model} onChange={setModel} disabled={busy} />;

  const newChat = () => {
    chat.stop();
    chat.setMessages([]);
    chat.clearError();
  };

  return (
    <Flex direction="column" alignItems="stretch" height="100%">
      <ChatHeader canReset={chat.messages.length > 0} onNewChat={newChat} onClose={onClose} />

      <Box flex="1" overflow="auto" padding={4}>
        <Flex direction="column" alignItems="stretch" gap={4}>
          {chat.messages.length === 0 ? <Suggestions onPick={send} /> : null}
          {chat.messages.map((message: any, index: number) => (
            <ChatMessage
              key={message.id}
              message={message}
              streaming={chat.status === 'streaming' && index === chat.messages.length - 1}
              onRespond={respond}
            />
          ))}
          {isThinking(chat.messages, chat.status) ? <StatusText>Thinking…</StatusText> : null}
          {chat.error ? (
            <Typography variant="pi" textColor="danger600">
              {readError(chat.error)}
            </Typography>
          ) : null}
          <div ref={bottom} />
        </Flex>
      </Box>

      <ChatInput busy={busy} onSend={send} onStop={chat.stop} picker={picker} />
    </Flex>
  );
};

export default ChatPanel;

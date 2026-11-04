import { Box, Flex, IconButton, Typography } from '@strapi/design-system';
import { Cross, Pencil, Sparkle } from '@strapi/icons';

type Props = {
  canReset: boolean;
  onNewChat: () => void;
  onClose: () => void;
};

// The assistant's badge and name, plus "New chat" (clears the conversation) and close.
const ChatHeader = ({ canReset, onNewChat, onClose }: Props) => (
  <Flex
    gap={3}
    alignItems="center"
    paddingTop={3}
    paddingBottom={3}
    paddingLeft={4}
    paddingRight={3}
    borderColor="neutral150"
    borderStyle="solid"
    borderWidth="0 0 1px 0"
  >
    <Flex
      width="3.2rem"
      height="3.2rem"
      justifyContent="center"
      alignItems="center"
      background="primary100"
      borderRadius="50%"
    >
      <Sparkle fill="primary600" />
    </Flex>
    <Box flex="1">
      <Typography variant="omega" fontWeight="bold" tag="p">
        Publishing assistant
      </Typography>
      <Typography variant="pi" textColor="neutral500" tag="p">
        Dev.to, Medium, Bluesky, LinkedIn & Facebook
      </Typography>
    </Box>
    <IconButton label="New chat" variant="ghost" onClick={onNewChat} disabled={!canReset}>
      <Pencil />
    </IconButton>
    <IconButton label="Close chat" variant="ghost" onClick={onClose}>
      <Cross />
    </IconButton>
  </Flex>
);

export default ChatHeader;

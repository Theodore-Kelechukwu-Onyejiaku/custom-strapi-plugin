import { Box, Button, Flex, Typography } from '@strapi/design-system';
import { Check, Cross } from '@strapi/icons';

import { StatusText } from './StatusText';
import { toolLabel, toolNameOf } from './activity';

// Publishing waits here until the editor clicks. The approval is signed on the server, so
// only these buttons can let a publish through.
const Approval = ({ part, onRespond }: any) => (
  <Box padding={3} hasRadius background="warning100" borderColor="warning200">
    <Typography variant="omega" fontWeight="bold">
      {`Publish to ${part.input?.platform}?`}
    </Typography>
    <Box paddingTop={1} paddingBottom={2}>
      <Typography variant="pi" textColor="neutral600">
        {`Post ${part.input?.postId}. This is public and can't be undone.`}
      </Typography>
    </Box>
    <Flex gap={2}>
      <Button size="S" onClick={() => onRespond(part.approval.id, true)}>
        Publish
      </Button>
      <Button size="S" variant="tertiary" onClick={() => onRespond(part.approval.id, false)}>
        Cancel
      </Button>
    </Flex>
  </Box>
);

// One step the assistant took, like "Searched the web" in ChatGPT or Claude:
// "Looking up posts…" with a shine while it runs, then "✓ Looked up posts".
const ToolCall = ({ part, onRespond }: any) => {
  if (part.state === 'approval-requested') return <Approval part={part} onRespond={onRespond} />;

  const finished = part.state?.startsWith('output');
  const platform = part.input?.platform ? ` · ${part.input.platform}` : '';
  const label = toolLabel(toolNameOf(part), finished) + platform;

  if (!finished) return <StatusText>{`${label}…`}</StatusText>;

  const failed = part.state === 'output-error';
  const denied = part.state === 'output-denied';

  return (
    <Flex gap={2} alignItems="center">
      {failed ? <Cross fill="danger600" /> : denied ? null : <Check fill="success600" />}
      <Typography variant="pi" textColor="neutral600">
        {denied ? `Cancelled${platform}` : label}
      </Typography>
      {failed ? (
        <Typography variant="pi" textColor="danger600">
          {part.errorText}
        </Typography>
      ) : null}
    </Flex>
  );
};

export default ToolCall;

import styled from 'styled-components';
import { Flex, Typography } from '@strapi/design-system';
import { Sparkle } from '@strapi/icons';

// Ready-made questions shown in an empty chat. Clicking one sends it right away, like the
// starter prompts in ChatGPT or Claude. Publishing still waits for the editor to approve it.
const QUESTIONS = [
  'What can I publish?',
  'Which posts are not on Dev.to yet?',
  'Which platforms are ready to publish to?',
  'Publish my newest post to Bluesky',
];

const Card = styled.button`
  padding: 10px 12px;
  text-align: left;
  font: inherit;
  font-size: 1.3rem;
  line-height: 1.8rem;
  cursor: pointer;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  background: ${({ theme }) => theme.colors.neutral0};
  color: ${({ theme }) => theme.colors.neutral800};
  transition:
    background 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primary100};
    border-color: ${({ theme }) => theme.colors.primary200};
  }
`;

const Suggestions = ({ onPick }: { onPick: (text: string) => void }) => (
  <Flex direction="column" alignItems="stretch" gap={4} paddingTop={6}>
    <Flex direction="column" gap={2}>
      <Flex
        width="4.8rem"
        height="4.8rem"
        justifyContent="center"
        alignItems="center"
        background="primary100"
        borderRadius="50%"
      >
        <Sparkle fill="primary600" width="2.4rem" height="2.4rem" />
      </Flex>
      <Typography variant="beta" tag="h2">
        What would you like to publish?
      </Typography>
      <Typography variant="omega" textColor="neutral600" textAlign="center">
        Ask what has been published where, or start with one of these.
      </Typography>
    </Flex>
    <Flex direction="column" alignItems="stretch" gap={2}>
      {QUESTIONS.map((question) => (
        <Card key={question} type="button" onClick={() => onPick(question)}>
          {question}
        </Card>
      ))}
    </Flex>
  </Flex>
);

export default Suggestions;

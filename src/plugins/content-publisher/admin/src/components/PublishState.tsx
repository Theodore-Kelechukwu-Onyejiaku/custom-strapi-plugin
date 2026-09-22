import { Button, Typography, LinkButton, Flex } from '@strapi/design-system';
import { Check } from '@strapi/icons';

export const bigBtn = { width: '100px' };
export const smBtn = { width: '50px' };

export const row = {
  gap: { large: 2 },
  direction: { medium: 'row' } as any,
  alignItems: { initial: 'center' } as any,
};

// Already published: state the fact and link out to the live post.
export const PublishedState = ({ link }: { link: string }) => (
  <Flex {...row}>
    <Button
      style={{ ...bigBtn, cursor: 'not-allowed' }}
      variant="success-light"
      startIcon={<Check />}
    >
      <Typography variant="pi">published</Typography>
    </Button>
    <LinkButton href={link} isexternal="true" style={smBtn} variant="secondary">
      visit
    </LinkButton>
  </Flex>
);

export const PublishingState = () => (
  <Button style={bigBtn} loading textcolor="neutral800">
    <Typography variant="pi">publishing</Typography>
  </Button>
);

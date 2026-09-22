import { Box, Flex, Loader, Tooltip, Typography } from '@strapi/design-system';

import type { PlatformTarget } from '../platformTargets';

// One chip per platform instead of a whole table column of buttons each — that did not
// survive a third platform. A published chip is solid and opens the live post; the rest are
// muted, so "where has this gone out" is one glance rather than three.
const Chip = ({ target, link, publishing }: any) => {
  const { Icon, label } = target;

  return (
    <Flex
      gap={1}
      alignItems="center"
      paddingLeft={2}
      paddingRight={2}
      paddingTop={1}
      paddingBottom={1}
      hasRadius
      background={link ? 'success100' : 'neutral100'}
      borderColor={link ? 'success200' : 'neutral200'}
    >
      {publishing ? <Loader small /> : <Icon />}
      <Typography variant="pi" fontWeight="bold" textColor={link ? 'success600' : 'neutral500'}>
        {label}
      </Typography>
    </Flex>
  );
};

const PlatformChips = ({ post, platforms, busy }: any) => (
  <Flex gap={2} wrap="wrap">
    {platforms.map((target: PlatformTarget) => {
      const link = post[target.linkField];
      const chip = <Chip target={target} link={link} publishing={busy === target.type} />;

      if (!link) {
        return (
          <Tooltip key={target.type} label={`Not published to ${target.label}`}>
            <Box>{chip}</Box>
          </Tooltip>
        );
      }

      return (
        <Tooltip key={target.type} label={`Open on ${target.label}`}>
          <Box tag="a" href={link} target="_blank" rel="noreferrer">
            {chip}
          </Box>
        </Tooltip>
      );
    })}
  </Flex>
);

export default PlatformChips;

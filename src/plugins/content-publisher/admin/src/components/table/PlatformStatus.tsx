import { Box, Flex, Loader, Tooltip, Typography } from '@strapi/design-system';

import type { PlatformTarget } from '../platformTargets';

// Ten platforms cannot each have a table column, so they share one cell: an icon per
// platform, full strength when published and faded when not, with the count spelled out so a
// row can be read without decoding icons. A published icon opens the live post.
const PlatformStatus = ({ post, platforms, busy }: any) => {
  if (platforms.length === 0) {
    return (
      <Typography variant="pi" textColor="neutral500">
        No platforms on
      </Typography>
    );
  }

  const published = platforms.filter((target: PlatformTarget) => post[target.linkField]);

  return (
    <Flex gap={2} alignItems="center">
      <Typography
        variant="pi"
        fontWeight="bold"
        textColor={published.length > 0 ? 'success600' : 'neutral500'}
      >
        {`${published.length}/${platforms.length}`}
      </Typography>

      <Flex gap={1} alignItems="center" wrap="wrap">
        {platforms.map((target: PlatformTarget) => {
          const link = post[target.linkField];
          const { Icon, label, key } = target;

          if (busy === key) return <Loader key={key} small />;

          // faded rather than hidden, so the row shows what is still outstanding
          const icon = (
            <Box style={{ opacity: link ? 1 : 0.3, display: 'flex' }}>
              <Icon />
            </Box>
          );

          return (
            <Tooltip key={key}label={link ? `Open on ${label}` : `Not published to ${label}`}>
              {link ? (
                <Box tag="a" href={link} target="_blank" rel="noreferrer">
                  {icon}
                </Box>
              ) : (
                <Box>{icon}</Box>
              )}
            </Tooltip>
          );
        })}
      </Flex>
    </Flex>
  );
};

export default PlatformStatus;

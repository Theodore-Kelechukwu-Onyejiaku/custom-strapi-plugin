import { Box, Flex, Typography, Badge } from '@strapi/design-system';

import { PLATFORM_META } from './platformMeta';

// A platform's name, icon and blurb, plus the env vars it needs. The env vars are not
// editable from the admin panel — they are read from the server's environment — so they
// are stated here rather than offered as fields. `action` is the on/off switch, when the
// platform has one.
const PlatformHeader = ({ platformKey, label, envVars, action }: any) => {
  const { Icon, description } = PLATFORM_META[platformKey] ?? ({} as any);

  return (
    <Flex justifyContent="space-between" alignItems="center" gap={4}>
      <Flex gap={3} alignItems="center">
        {Icon ? <Icon /> : null}
        <Box>
          <Typography variant="omega" fontWeight="bold">
            {label}
          </Typography>
          <Box>
            <Typography variant="omega" textColor="neutral600">
              {description}
            </Typography>
          </Box>
        </Box>
      </Flex>
      <Flex gap={3} alignItems="center">
        {envVars?.length ? <Badge>Needs {envVars.join(', ')}</Badge> : null}
        {action}
      </Flex>
    </Flex>
  );
};

export default PlatformHeader;

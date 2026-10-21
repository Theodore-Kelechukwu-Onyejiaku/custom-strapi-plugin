import { Badge, Box, Flex, Typography } from '@strapi/design-system';

import TestConnection from './TestConnection';
import { usePlatformTest } from '../../hooks/usePlatformTest';
import type { CredentialSummary, Platform } from '../../utils/settingsTypes';

type Props = {
  platform: Platform;
  summaries: Record<string, CredentialSummary>;
};

// Read-only on purpose. API keys live in the .env file and nowhere else: there is no field to
// paste one into, and the server only says whether each is set — never any part of it.
const PlatformCredentials = ({ platform, summaries }: Props) => {
  const { test, testing } = usePlatformTest(platform.key, platform.label);

  // Bluesky needs a handle *and* an app password to sign in, Medium a user id and a token.
  // There is one connection per platform, so one test, once everything it needs is set.
  const ready = platform.envVars.every((name: string) => summaries?.[name]?.configured);

  return (
    <Box>
      <Box paddingBottom={1}>
        <Typography variant="pi" fontWeight="bold" textColor="neutral600">
          Credentials
        </Typography>
      </Box>
      <Box paddingBottom={4}>
        <Typography variant="pi" textColor="neutral600">
          Read from your project’s .env file. To change one, edit .env and restart Strapi.
        </Typography>
      </Box>

      <Flex direction="column" alignItems="stretch" gap={2}>
        {platform.envVars.map((name) => (
          <Flex key={name} justifyContent="space-between" gap={4}>
            <Typography variant="omega" fontWeight="semiBold">
              {name}
            </Typography>
            {summaries?.[name]?.configured ? (
              <Badge>Set in .env</Badge>
            ) : (
              <Badge textColor="danger600" backgroundColor="danger100">
                Missing
              </Badge>
            )}
          </Flex>
        ))}
      </Flex>

      <TestConnection platform={platform} ready={ready} onTest={test} testing={testing} />
    </Box>
  );
};

export default PlatformCredentials;

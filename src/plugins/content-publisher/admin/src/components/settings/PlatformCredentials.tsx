import { Box, Flex, Typography } from '@strapi/design-system';

import CredentialField from './CredentialField';
import TestConnection from './TestConnection';
import { usePlatformCredentials } from '../../hooks/usePlatformCredentials';
import { usePlatformTest } from '../../hooks/usePlatformTest';
import type { CredentialSummary, Platform, Settings } from '../../utils/settingsTypes';

type Props = {
  platform: Platform;
  summaries: Record<string, CredentialSummary>;
  canUpdate: boolean;
  onSaved: (settings: Settings) => void;
  onError: (message: string) => void;
};

// A key entered here overrides the environment variable of the same name, so it can be
// rotated without a redeploy. Leaving it blank keeps whatever the environment provides.
const PlatformCredentials = ({ platform, summaries, canUpdate, onSaved, onError }: Props) => {
  const { save, saving } = usePlatformCredentials({
    platformKey: platform.key,
    onSaved,
    onError,
  });

  const { test, testing } = usePlatformTest(platform.key, platform.label);

  // Bluesky needs a handle *and* an app password to sign in, Medium a user id and a token.
  // There is one connection per platform, so there is one test — and it only makes sense
  // once everything that connection needs is present.
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
          Stored encrypted. A key saved here overrides the environment variable of the same
          name. Test checks the whole connection without publishing anything.
        </Typography>
      </Box>
      <Flex direction="column" alignItems="stretch" gap={4}>
        {platform.envVars.map((name) => (
          <CredentialField
            key={name}
            name={name}
            summary={summaries?.[name]}
            saving={saving}
            canUpdate={canUpdate}
            onSave={save}
          />
        ))}
      </Flex>

      <TestConnection platform={platform} ready={ready} onTest={test} testing={testing} />
    </Box>
  );
};

export default PlatformCredentials;

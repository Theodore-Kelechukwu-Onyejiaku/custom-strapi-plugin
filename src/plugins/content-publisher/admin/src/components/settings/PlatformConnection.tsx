import { Box, Button, Flex, Typography } from '@strapi/design-system';

import PageSelect from './PageSelect';
import ConnectionStatus from './ConnectionStatus';
import { usePlatformConnection } from '../../hooks/usePlatformConnection';
import { usePlatformTest } from '../../hooks/usePlatformTest';

// Shown instead of the credential fields for LinkedIn and Facebook. The app's client id and
// secret come from .env, so there is nothing to type here — just a Connect button that opens
// the provider's sign-in page.
const missingText = (envVars: string[]) =>
  `Add ${envVars.join(' and ')} to the .env file and restart Strapi to connect.`;
const PlatformConnection = ({ platform, connection, summaries, canUpdate, ...rest }: any) => {
  const { key, label, envVars } = platform;
  const account = connection?.account;
  const ready = envVars.every((name: string) => summaries?.[name]?.configured);
  const actions = usePlatformConnection({ platformKey: key, platformLabel: label, ...rest });
  const { test, testing } = usePlatformTest(key, label);

  return (
    <Box>
      <Box paddingBottom={2}>
        <Typography variant="pi" fontWeight="bold" textColor="neutral600">
          Account
        </Typography>
      </Box>
      <ConnectionStatus label={label} account={account} />

      {account?.pages?.length > 1 ? (
        <PageSelect account={account} actions={actions} canUpdate={canUpdate} />
      ) : null}

      <Flex gap={2} paddingTop={4}>
        <Button
          onClick={ready ? actions.connect : () => rest.onError(missingText(envVars))}
          loading={actions.busy === 'connect'}
          disabled={!canUpdate}
          variant={account ? 'secondary' : 'default'}
        >
          {account ? 'Reconnect' : `Connect ${label}`}
        </Button>
        {account ? (
          <Button variant="secondary" onClick={test} loading={testing}>
            Test connection
          </Button>
        ) : null}
        {account && canUpdate ? (
          <Button
            variant="danger-light"
            onClick={actions.disconnect}
            loading={actions.busy === 'disconnect'}
          >
            Disconnect
          </Button>
        ) : null}
      </Flex>

      <Box paddingTop={2}>
        <Typography variant="pi" textColor="neutral600">
          {ready
            ? `Redirect URL for your ${label} app: ${connection?.redirectUri}`
            : missingText(envVars)}
        </Typography>
      </Box>
    </Box>
  );
};

export default PlatformConnection;

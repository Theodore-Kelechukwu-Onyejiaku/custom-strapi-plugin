import { Badge, Flex, Typography } from '@strapi/design-system';

import formattedDate from '../../utils/formattedDate';
import type { ConnectedAccount } from '../../utils/settingsTypes';

// LinkedIn tokens last 60 days with no refresh, so say plainly when one has run out.
const isExpired = (account: ConnectedAccount) =>
  Boolean(account.expiresAt) && new Date(account.expiresAt as string) < new Date();

const expiryText = (account: ConnectedAccount, expired: boolean) => {
  if (!account.expiresAt) return 'This connection does not expire.';
  const date = formattedDate(new Date(account.expiresAt));
  return `${expired ? 'Expired' : 'Expires'} ${date}. Reconnect to renew.`;
};

// Who is signed in, or that nobody is yet.
const ConnectionStatus = ({ label, account }: { label: string; account?: ConnectedAccount }) => {
  if (!account) {
    return (
      <Typography variant="omega" textColor="neutral600">
        {`Not connected. Click Connect to sign in with ${label}.`}
      </Typography>
    );
  }

  const expired = isExpired(account);

  return (
    <Flex direction="column" alignItems="flex-start" gap={1}>
      <Flex gap={2} alignItems="center">
        <Typography variant="omega" fontWeight="bold">
          {`Connected as ${account.accountName}`}
        </Typography>
        {expired ? <Badge>Expired</Badge> : null}
      </Flex>
      <Typography variant="pi" textColor="neutral600">
        {expiryText(account, expired)}
      </Typography>
    </Flex>
  );
};

export default ConnectionStatus;

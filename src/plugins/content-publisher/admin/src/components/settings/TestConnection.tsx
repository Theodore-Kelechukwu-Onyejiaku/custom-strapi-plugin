import { Box, Button, Typography } from '@strapi/design-system';

// One button per platform, not per credential: Bluesky signs in with a handle *and* an app
// password, Medium with a user id and a token. There is a single connection behind them, so
// testing each field separately would have meant two buttons doing the same thing.
const TestConnection = ({ platform, ready, onTest, testing }: any) => (
  <Box paddingTop={4}>
    <Button variant="secondary" onClick={onTest} loading={testing} disabled={!ready}>
      Test connection
    </Button>

    {!ready ? (
      <Box paddingTop={1}>
        <Typography variant="pi" textColor="neutral600">
          {`Add ${platform.envVars.join(' and ')} to .env and restart Strapi to test.`}
        </Typography>
      </Box>
    ) : null}
  </Box>
);

export default TestConnection;

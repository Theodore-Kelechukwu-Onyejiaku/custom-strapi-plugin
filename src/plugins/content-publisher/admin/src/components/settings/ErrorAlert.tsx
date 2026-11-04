import { Alert, Box } from '@strapi/design-system';

// Shown above the sections when a save is rejected. The message comes from the server, so
// a rejected mapping says which attribute was wrong rather than just "failed".
const ErrorAlert = ({ error, onClose }: { error: string | null; onClose: () => void }) => {
  if (!error) return null;

  return (
    <Box paddingBottom={4}>
      <Alert closeLabel="Close" title="Something went wrong" variant="danger" onClose={onClose}>
        {error}
      </Alert>
    </Box>
  );
};

export default ErrorAlert;

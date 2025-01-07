import { Box, Button, Typography, LinkButton, Flex, Link } from '@strapi/design-system';
import { Play, Check, Cursor } from '@strapi/icons';

const PublishButton = ({ post, type }: { post: any; type: string }) => {
  return (
    <Box>
      <Button style={btnStylePrimary} size="S" startIcon={<Play />} variant="default">
        <Typography variant="pi">start</Typography>
      </Button>
    </Box>
  );
};

const btnStylePrimary = {
  width: '100px',
};

export default PublishButton;

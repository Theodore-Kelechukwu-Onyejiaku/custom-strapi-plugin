import { Box, Button, Typography, Flex } from '@strapi/design-system';
import { Play } from '@strapi/icons';

import { getTarget } from './platformTargets';
import { PublishedState, PublishingState, bigBtn, row } from './PublishState';
import { usePublishActions } from '../hooks/usePublishActions';

// Which platform this button publishes to, and which field holds the resulting URL, both
// come from platformTargets — so adding a platform there adds it here.
//
// `onPublished` refetches the table. It used to call window.location.reload(), which threw
// away the search term and the page you were on every time you published something.
const PublishButton = ({ post, type, onPublished }: any) => {
  const target = getTarget(type);
  const link = target ? post[target.linkField] : null;
  const { loading, publish } = usePublishActions(post, target, onPublished);

  if (loading) return <Box>{<PublishingState />}</Box>;

  if (link) return <Box>{<PublishedState link={link} />}</Box>;

  return (
    <Box>
      <Flex {...row}>
        <Button style={bigBtn} size="S" onClick={publish} startIcon={<Play />} variant="default">
          <Typography variant="pi">start</Typography>
        </Button>
      </Flex>
    </Box>
  );
};

export default PublishButton;

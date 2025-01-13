import { useState } from 'react';
import { Box, Button, Typography, LinkButton, Flex } from '@strapi/design-system';
import { Play, Check } from '@strapi/icons';

import axios from 'axios';

const PublishButton = ({ post, type }: { post: any; type: string }) => {
  const [loading, setLoading] = useState<boolean>(false);

  // Function to handle publishing the post
  const handlePublishPost = async () => {
    try {
      // Set loading to true
      setLoading(true);
      let endpoint;

      // Check if the type is medium or devto
      if (type === 'medium') {
        endpoint = '/content-publisher/publish-to-medium';
      } else {
        endpoint = '/content-publisher/publish-to-devto';
      }

      // Post the data
      await axios.post(endpoint, post);

      // Reload the page
      window.location.reload();
    } catch (error) {
      console.log(error);
    } finally {
      // Set loading to false
      setLoading(false);
    }
  };

  return (
    <Box>
      {(type === 'medium' ? post.mediumLink : post.devToLink) ? (
        <Flex
          gap={{
            large: 2,
          }}
          direction={{
            medium: 'row',
          }}
          alignItems={{
            initial: 'center',
          }}
        >
          <Button
            style={{ ...bigBtn, cursor: 'not-allowed' }}
            variant="success-light"
            startIcon={<Check />}
          >
            <Typography variant="pi">published</Typography>
          </Button>

          <LinkButton
            href={type === 'medium' ? post.mediumLink : post.devToLink}
            isExternal={true}
            style={smBtn}
            variant="secondary"
          >
            visit
          </LinkButton>
        </Flex>
      ) : loading ? (
        <Button style={bigBtn} loading textColor="neutral800">
          <Typography variant="pi">publishing</Typography>
        </Button>
      ) : (
        <Flex
          gap={{
            large: 2,
          }}
          direction={{
            medium: 'row',
          }}
          alignItems={{
            initial: 'center',
          }}
        >
          <Button
            style={bigBtn}
            size="S"
            onClick={() => {
              handlePublishPost();
            }}
            startIcon={<Play />}
            variant="default"
          >
            <Typography variant="pi">start</Typography>
          </Button>
          <Button
            href={type === 'medium' ? post.mediumLink : post.devToLink}
            isExternal
            style={{ ...smBtn, cursor: 'not-allowed' }}
            variant="secondary"
          >
            ?
          </Button>
        </Flex>
      )}
    </Box>
  );
};

const bigBtn = {
  width: '100px',
};

const smBtn = {
  width: '50px',
};

export default PublishButton;

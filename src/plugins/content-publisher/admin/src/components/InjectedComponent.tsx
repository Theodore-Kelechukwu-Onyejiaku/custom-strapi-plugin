import React from 'react';
import { Box, Flex, Typography, Divider } from '@strapi/design-system';
import { unstable_useContentManagerContext } from '@strapi/strapi/admin';

import axios from 'axios';
import { useEffect, useState } from 'react';
import PublishButton from './PublishButton';
import MediumIcon from './MediumIcon';
import DevToIcon from './DevToIcon';

export default function InjectedComponent() {
  const { slug, id } = unstable_useContentManagerContext();
  const [post, setPost] = useState({
    mediumLink: '',
    devToLink: '',
    blog: null,
  });

  const fetchSinglePost = async () => {
    const post = await axios.get(`/medium-publisher/single-post?blogId=${id}`);
    setPost(post.data);
  };

  useEffect(() => {
    // fetchBlog();
    fetchSinglePost();
  }, []);

  if (slug !== 'api::blog.blog') return null;

  return (
    <Box>
      {post ? (
        <>
          <Typography variant="beta" padding={30}>
            Publish to:
          </Typography>
          <Box marginTop={5}>
            <Flex
              gap={{
                large: 2,
              }}
              direction={{
                initial: 'row',
              }}
              alignItems={{
                initial: 'center',
              }}
            >
              <Typography variant="sigma">Medium</Typography>
            </Flex>

            <PublishButton post={post} type="medium" />
            <Divider />
          </Box>

          <Box padding={30}>
            <Divider marginBottom={4} />
            <Flex
              gap={{
                large: 2,
              }}
              direction={{
                initial: 'row',
              }}
              alignItems={{
                initial: 'center',
              }}
            >
              <Typography variant="sigma">Dev.to</Typography>
            </Flex>
            <PublishButton post={post} type="devto" />
          </Box>
        </>
      ) : null}
    </Box>
  );
}
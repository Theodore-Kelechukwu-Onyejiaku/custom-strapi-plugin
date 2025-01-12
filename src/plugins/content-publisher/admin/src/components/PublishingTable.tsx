import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  Typography,
  Box,
  Link,
  Flex,
} from '@strapi/design-system';

import { Trash } from '@strapi/icons';

import axios from 'axios';
import { useState, useEffect, FormEvent } from 'react';

import formattedDate from '../utils/formattedDate';
import PublishButton from './PublishButton';
import MediumIcon from './MediumIcon';
import DevToIcon from './DevToIcon';

const PublishingTable = () => {
  const [posts, setPosts] = useState([]);

  const handleFetchPosts = async () => {
    try {
      // Get posts from content-publisher plugin
      const response = await axios.get(`/content-publisher/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  useEffect(() => {
    handleFetchPosts();
  }, []);

  return (
    <Box>
      <Box padding={8} margin={20}>
        <Table colCount={7} rowCount={posts.length + 1}>
          <Thead>
            <Tr>
              <Th>
                <Typography variant="sigma" textColor="neutral600">
                  Blog ID
                </Typography>
              </Th>
              <Th>
                <Typography variant="sigma" textColor="neutral600">
                  Date Created
                </Typography>
              </Th>
              <Th>
                <Typography variant="sigma" textColor="neutral600">
                  Blog Title
                </Typography>
              </Th>
              <Th>
                <Typography variant="sigma" textColor="neutral600">
                  Blog Link
                </Typography>
              </Th>
              <Th>
                <Flex gap={2} direction="row" alignItems="center">
                  {/* Medium icon */}
                  <MediumIcon />
                  <Typography variant="sigma">Medium</Typography>
                </Flex>
              </Th>
              <Th>
                <Flex gap={2} direction="row" alignItems="center">
                  {/* Dev.to icon */}
                  <DevToIcon />
                  <Typography variant="sigma">Dev.to</Typography>
                </Flex>
              </Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {posts.map((post: any) => (
              <Tr key={post.id}>
                <Td>
                  <Typography textColor="neutral800">{post.id}</Typography>
                </Td>
                <Td>
                  <Typography textColor="neutral800">
                    {formattedDate(post.blog?.updatedAt)}
                  </Typography>
                </Td>
                <Td>
                  <Typography textColor="neutral800">{post.blog.title.slice(0, 30)}...</Typography>
                </Td>
                <Td>
                  <Typography textColor="neutral800">
                    <Link
                      href={`http://localhost:1337/admin/content-manager/collection-types/api::blog.blog/${post.blog.documentId}`}
                    >
                      {post.blog.title.slice(0, 30)}...
                    </Link>
                  </Typography>
                </Td>
                <Td>
                  <PublishButton post={post} type="medium" />
                </Td>
                <Td>
                  <PublishButton post={post} type="devto" />
                </Td>
                <Td>
                  <Trash style={{ cursor: 'pointer', color: 'red' }} width={20} height={20} />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default PublishingTable;

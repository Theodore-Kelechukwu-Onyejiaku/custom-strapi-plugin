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
                  {/* medium icon */}
                  <svg
                    width="24px"
                    height="24px"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      {' '}
                      <path
                        d="M13 12C13 15.3137 10.3137 18 7 18C3.68629 18 1 15.3137 1 12C1 8.68629 3.68629 6 7 6C10.3137 6 13 8.68629 13 12Z"
                        fill="#0F0F0F"
                      ></path>{' '}
                      <path
                        d="M23 12C23 14.7614 22.5523 17 22 17C21.4477 17 21 14.7614 21 12C21 9.23858 21.4477 7 22 7C22.5523 7 23 9.23858 23 12Z"
                        fill="#0F0F0F"
                      ></path>{' '}
                      <path
                        d="M17 18C18.6569 18 20 15.3137 20 12C20 8.68629 18.6569 6 17 6C15.3431 6 14 8.68629 14 12C14 15.3137 15.3431 18 17 18Z"
                        fill="#0F0F0F"
                      ></path>{' '}
                    </g>
                  </svg>
                  <Typography variant="sigma">Medium</Typography>
                </Flex>
              </Th>
              <Th>
                <Flex gap={2} direction="row" alignItems="center">
                  {/* \dev.to icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    aria-label="dev.to"
                    role="img"
                    viewBox="0 0 512 512"
                    width="24px"
                    height="24px"
                    fill="#000000"
                  >
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      <rect width="512" height="512" rx="15%"></rect>
                      <path
                        fill="#ffffff"
                        d="M140.47 203.94h-17.44v104.47h17.45c10.155-.545 17.358-8.669 17.47-17.41v-69.65c-.696-10.364-7.796-17.272-17.48-17.41zm45.73 87.25c0 18.81-11.61 47.31-48.36 47.25h-46.4V172.98h47.38c35.44 0 47.36 28.46 47.37 47.28zm100.68-88.66H233.6v38.42h32.57v29.57H233.6v38.41h53.29v29.57h-62.18c-11.16.29-20.44-8.53-20.72-19.69V193.7c-.27-11.15 8.56-20.41 19.71-20.69h63.19zm103.64 115.29c-13.2 30.75-36.85 24.63-47.44 0l-38.53-144.8h32.57l29.71 113.72 29.57-113.72h32.58z"
                      ></path>
                    </g>
                  </svg>
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

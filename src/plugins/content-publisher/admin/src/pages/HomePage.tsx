import { Main, Box, Typography } from '@strapi/design-system';

const HomePage = () => {
  return (
    <Main padding={5}>
      <Box paddingBottom={4} margin={20}>
        <Typography variant="alpha">Welcome To Content Publisher</Typography>
        <Box>
          <Typography variant="epsilon">Publish blog posts to medium, dev.to, etc.</Typography>
        </Box>
      </Box>
    </Main>
  );
};

export { HomePage };

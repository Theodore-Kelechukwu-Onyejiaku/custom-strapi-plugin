import { Box, Typography, Divider } from '@strapi/design-system';

// One bordered card, used for each section of the settings page. `delta` for the heading
// and `omega` for body copy matches how the Content Manager builds its own setting cards.
const Section = ({ title, hint, children }: any) => (
  <Box padding={6} hasRadius background="neutral0" shadow="tableShadow" borderColor="neutral150">
    <Box paddingBottom={1}>
      <Typography variant="delta" tag="h2">
        {title}
      </Typography>
    </Box>
    {hint ? (
      <Box paddingBottom={4}>
        <Typography variant="omega" textColor="neutral600">
          {hint}
        </Typography>
      </Box>
    ) : null}
    <Divider />
    <Box paddingTop={4}>{children}</Box>
  </Box>
);

export default Section;

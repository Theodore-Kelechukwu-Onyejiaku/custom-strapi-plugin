import { Flex, Loader, Menu, Typography } from '@strapi/design-system';
import { Check, ExternalLink } from '@strapi/icons';
import { unstable_useContentManagerContext, useFetchClient } from '@strapi/strapi/admin';

import { useCallback, useEffect, useState } from 'react';

import { usePublishTargets } from '../hooks/usePublishTargets';

/**
 * Rendered in the content manager's `editView.right-links` zone, inside the Actions panel
 * on the right of the edit view. The panel is narrow, so the platforms live behind a
 * dropdown rather than taking vertical space — the menu scrolls once more platforms are
 * added.
 *
 * It only appears on the collection types saved in Settings > Publishing Settings.
 */
export default function InjectedComponent() {
  const { slug, id } = unstable_useContentManagerContext();
  // useFetchClient sends the admin JWT; the settings route is authenticated
  const { get, post: postRequest } = useFetchClient();

  // which types are publishable and which platforms are on; a platform switched off in the
  // settings is left out entirely rather than offering a button the server would refuse
  const { contentTypes: publishableTypes, platforms: PLATFORMS } = usePublishTargets();
  const [trackingPost, setTrackingPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // which platform is mid-publish; the menu closes on select, so the status shows below
  const [publishing, setPublishing] = useState<string | null>(null);

  const fetchTrackingPost = useCallback(async () => {
    // looked up by the entry itself, so this works for any configured collection type
    const query = `contentType=${encodeURIComponent(slug)}&entryId=${id}`;
    const { data } = await get(`/content-publisher/single-post?${query}`);
    return data;
  }, [slug, id]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // the hook has not answered yet, so there is nothing to decide on
      if (publishableTypes === null) return;

      if (!publishableTypes.includes(slug) || !id) {
        setLoading(false);
        return;
      }

      try {
        // the edit view stays mounted while navigating between entries, so a slower
        // earlier request must not overwrite a newer one
        const found = await fetchTrackingPost();
        if (!cancelled) setTrackingPost(found);
      } catch (error) {
        if (!cancelled) setTrackingPost(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    load();

    return () => {
      cancelled = true;
    };
    // re-evaluate when the editor moves to a different entry, or once the targets land
  }, [slug, id, publishableTypes, fetchTrackingPost]);

  const handlePublish = async (platform: (typeof PLATFORMS)[number]) => {
    setPublishing(platform.label);
    try {
      await postRequest(platform.endpoint, trackingPost);
      // refetch rather than reloading the whole admin panel
      setTrackingPost(await fetchTrackingPost());
    } catch (error) {
      // the server returns a readable message; the entry simply stays unpublished
    } finally {
      setPublishing(null);
    }
  };

  // render nothing until the configured types are known, otherwise the panel would flash
  // on every content type's edit view before being hidden again
  if (publishableTypes === null || !publishableTypes.includes(slug)) return null;

  const publishedCount = trackingPost
    ? PLATFORMS.filter((platform) => trackingPost[platform.linkField]).length
    : 0;

  return (
    <Flex direction="column" alignItems="stretch" gap={2} width="100%">
      <Typography
        variant="sigma"
        textTransform="uppercase"
        textColor="neutral600"
        tag="h3"
        style={{ marginTop: '0.9rem' }}
      >
        Publish to
      </Typography>

      {loading ? (
        <Flex justifyContent="center" padding={2}>
          <Loader small>Loading publishing status</Loader>
        </Flex>
      ) : !trackingPost ? (
        <Typography variant="pi" textColor="neutral600">
          {/* any configured type is tracked now, so the only reason there is no record is
              that the entry has not been saved yet */}
          Save this entry first to publish it.
        </Typography>
      ) : (
        <>
          <Menu.Root>
            <Menu.Trigger
              variant="secondary"
              fullWidth
              loading={Boolean(publishing)}
              disabled={Boolean(publishing)}
            >
              {`${publishedCount} of ${PLATFORMS.length} published`}
            </Menu.Trigger>

            {/* maxHeight + overflow keeps the menu scrollable as platforms are added */}
            <Menu.Content
              popoverPlacement="bottom-start"
              maxHeight="20rem"
              overflow="auto"
              width="100%"
            >
              {PLATFORMS.map((platform) => {
                const url = trackingPost[platform.linkField];
                const { Icon } = platform;

                return url ? (
                  <Menu.Item
                    key={platform.type}
                    isExternal
                    href={url}
                    startIcon={<Icon />}
                    endIcon={<ExternalLink />}
                  >
                    {`View on ${platform.label}`}
                  </Menu.Item>
                ) : (
                  <Menu.Item
                    key={platform.type}
                    startIcon={<Icon />}
                    onSelect={() => handlePublish(platform)}
                  >
                    {`Publish to ${platform.label}`}
                  </Menu.Item>
                );
              })}
            </Menu.Content>
          </Menu.Root>

          {publishing ? (
            <Typography variant="pi" textColor="neutral600">
              {`Publishing to ${publishing}…`}
            </Typography>
          ) : publishedCount === PLATFORMS.length ? (
            <Flex gap={1} alignItems="center">
              <Check fill="success600" width="1.2rem" height="1.2rem" />
              <Typography variant="pi" textColor="success600">
                Published everywhere
              </Typography>
            </Flex>
          ) : null}
        </>
      )}
    </Flex>
  );
}

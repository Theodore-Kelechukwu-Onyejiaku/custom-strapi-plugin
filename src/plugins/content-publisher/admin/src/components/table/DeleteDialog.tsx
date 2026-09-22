import { Dialog, Button, IconButton, Typography } from '@strapi/design-system';
import { Trash, WarningCircle } from '@strapi/icons';

// Deleting was previously one unguarded click on a bare icon. The record holds the published
// URLs, so losing it means losing the only note of where an entry went.
const DeleteDialog = ({ title, onConfirm }: { title: string; onConfirm: () => void }) => (
  <Dialog.Root>
    <Dialog.Trigger>
      <IconButton label={`Delete the tracking record for ${title}`} variant="ghost">
        <Trash />
      </IconButton>
    </Dialog.Trigger>
    <Dialog.Content>
      <Dialog.Header>Delete tracking record</Dialog.Header>
      <Dialog.Body icon={<WarningCircle fill="danger600" />}>
        <Typography>
          This removes the record of where “{title}” was published. The blog entry and the
          published posts themselves are not touched.
        </Typography>
      </Dialog.Body>
      <Dialog.Footer>
        <Dialog.Cancel>
          <Button variant="tertiary">Cancel</Button>
        </Dialog.Cancel>
        <Dialog.Action>
          <Button variant="danger-light" startIcon={<Trash />} onClick={onConfirm}>
            Delete
          </Button>
        </Dialog.Action>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
);

export default DeleteDialog;

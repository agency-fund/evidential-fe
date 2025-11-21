'use client';
import { AlertDialog, Button, Flex, Text, TextField } from '@radix-ui/themes';
import { useEffect, useState } from 'react';

/**
 * A reusable delete confirmation dialog that requires users to type "delete" to confirm. Implemented via Radix
 * AlertDialog.
 *
 * ## Usage
 *
 * **Uncontrolled mode** is where the dialog visibility is controlled entirely by the DeleteAlertDialog. This
 * is generally what you want to use because it is the most straightforward.
 *
 * ```tsx
 * <DeleteAlertDialog
 *   title="Delete Item"
 *   description="Are you sure you want to delete this item?"
 *   trigger={trigger}
 *   loading={isMutating}
 *   renderTrigger={() => <IconButton color="red" variant="soft"><TrashIcon /></IconButton>}
 * >
 *   Optional warning text goes here as children.
 * </DeleteAlertDialog>
 * ```
 *
 * **Controlled mode** is only useful when the triggering component may be removed from the DOM before the dialog is
 * closed (such as when using DropdownMenu.Item). The calling component can pass open={bool} to control when the
 * dialog is open. Example:
 *
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <DropdownMenu.Item onClick={() => setOpen(true)}>Delete</DropdownMenu.Item>
 * <DeleteAlertDialog
 *   title="Delete Item"
 *   description="Are you sure you want to delete this item?"
 *   trigger={trigger}
 *   loading={isMutating}
 *   open={open}
 *   onOpenChange={setOpen}
 * />
 * ```
 */

type BaseDeleteAlertDialogProps = {
  /** Dialog title (e.g., "Delete Datasource"). */
  title: string;
  /** Dialog description/warning */
  description: string;
  /** Optional admonition displayed before the confirmation field. */
  children?: React.ReactNode;
  /** API trigger function to call when confirmed. This usually initiates a call to a deletion API. */
  trigger: () => Promise<void>;
  /** Loading state for the delete button. This should be true when an API request is outstanding. */
  loading?: boolean;
};

type UncontrolledDeleteAlertDialogProps = BaseDeleteAlertDialogProps & {
  /** Render function for the trigger button (wrapped in AlertDialog.Trigger). */
  renderTrigger: () => React.ReactNode;
  open?: never;
  onOpenChange?: never;
};

type ControlledDeleteAlertDialogProps = BaseDeleteAlertDialogProps & {
  renderTrigger?: never;
  /** Determines whether the dialog is open. */
  open: boolean;
  /** The dialog has some behavior which can close it (e.g. user clicks cancel). This will be invoked when that happens. */
  onOpenChange: (open: boolean) => void;
};

type DeleteAlertDialogProps = UncontrolledDeleteAlertDialogProps | ControlledDeleteAlertDialogProps;

export function DeleteAlertDialog({
  title,
  description,
  children,
  trigger,
  loading,
  renderTrigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: DeleteAlertDialogProps) {
  const [confirmation, setConfirmation] = useState<{ dialog: 'closed' } | { dialog: 'open'; text: string }>({
    dialog: 'closed',
  });

  const isControlled = controlledOpen !== undefined;

  // Sync confirmation state with controlled open prop
  useEffect(() => {
    if (!isControlled) {
      return;
    }
    if (controlledOpen && confirmation.dialog === 'closed') {
      setConfirmation({ dialog: 'open', text: '' });
    } else if (!controlledOpen && confirmation.dialog === 'open') {
      setConfirmation({ dialog: 'closed' });
    }
  }, [isControlled, controlledOpen, confirmation.dialog]);

  const isOpen = isControlled ? controlledOpen : confirmation.dialog === 'open';
  const isConfirmed = confirmation.dialog === 'open' && confirmation.text === 'delete';

  const handleConfirm = async () => {
    await trigger();
    setConfirmation({ dialog: 'closed' });
    if (isControlled) {
      controlledOnOpenChange?.(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(open);
    } else {
      if (open) {
        setConfirmation({ dialog: 'open', text: '' });
      } else {
        setConfirmation({ dialog: 'closed' });
      }
    }
  };

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      {renderTrigger && <AlertDialog.Trigger>{renderTrigger()}</AlertDialog.Trigger>}
      <AlertDialog.Content
        onKeyDown={async (e) => {
          if (e.key === 'Enter' && isConfirmed) {
            e.preventDefault();
            await handleConfirm();
          }
        }}
      >
        <AlertDialog.Title>{title}</AlertDialog.Title>
        <AlertDialog.Description>{description}</AlertDialog.Description>

        <Flex direction={'column'} mt={'4'}>
          {children && (
            <Text as="p" mb={'3'}>
              {children}
            </Text>
          )}
          <Text as="p" mb={'3'}>
            Please type &apos;delete&apos; in this text box to confirm.
          </Text>
          <TextField.Root
            value={confirmation.dialog === 'open' ? confirmation.text : ''}
            autoFocus={true}
            onChange={(e) => setConfirmation({ dialog: 'open', text: e.target.value })}
            placeholder="delete"
          />
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button
              variant="solid"
              color="red"
              disabled={!isConfirmed}
              loading={loading}
              onClick={async (e) => {
                e.preventDefault(); // Prevent Radix's handlers from closing the dialog
                if (!isConfirmed) {
                  return;
                }
                await handleConfirm();
              }}
            >
              Delete
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}

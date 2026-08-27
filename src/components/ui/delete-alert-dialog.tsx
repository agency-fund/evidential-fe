'use client';
import { AlertDialog, Button, Flex, Text, TextField } from '@radix-ui/themes';
import { useState } from 'react';
import { GenericErrorCallout } from './generic-error';

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
  error?: Error | null;
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

type DeleteAlertDialogFormProps = BaseDeleteAlertDialogProps & {
  onOpenChange: (open: boolean) => void;
};

function DeleteAlertDialogForm({
  title,
  description,
  children,
  trigger,
  loading,
  error,
  onOpenChange,
}: DeleteAlertDialogFormProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [errorDismissed, setErrorDismissed] = useState(true);
  const isConfirmed = confirmationText === 'delete';

  const handleConfirm = async () => {
    setErrorDismissed(false);
    try {
      await trigger();
      onOpenChange(false);
    } catch {
      // Parent's `error` prop will populate; keep dialog open.
    }
  };

  return (
    <>
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
          value={confirmationText}
          autoFocus={true}
          onChange={(e) => {
            setErrorDismissed(true);
            setConfirmationText(e.target.value);
          }}
          onKeyDown={async (e) => {
            if (e.key === 'Enter' && isConfirmed) {
              e.preventDefault();
              await handleConfirm();
            }
          }}
          placeholder="delete"
        />
        {!errorDismissed && error && <GenericErrorCallout title={`Failed: ${title}`} error={error} />}
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
    </>
  );
}

export function DeleteAlertDialog({
  title,
  description,
  children,
  trigger,
  loading,
  error,
  renderTrigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: DeleteAlertDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = (open: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(open);
    } else {
      setUncontrolledOpen(open);
    }
  };

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      {renderTrigger && <AlertDialog.Trigger>{renderTrigger()}</AlertDialog.Trigger>}
      <AlertDialog.Content>
        <DeleteAlertDialogForm
          title={title}
          description={description}
          trigger={trigger}
          loading={loading}
          error={error}
          onOpenChange={handleOpenChange}
        >
          {children}
        </DeleteAlertDialogForm>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}

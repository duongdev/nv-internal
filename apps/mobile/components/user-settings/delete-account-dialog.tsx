import type { FC } from 'react'
import { useEffect } from 'react'
import { DeleteAccountFinalConfirmation } from '@/components/user-settings/delete-account-final-confirmation'
import { DeleteAccountFirstWarning } from '@/components/user-settings/delete-account-first-warning'
import { DeleteAccountSuccess } from '@/components/user-settings/delete-account-success'
import { useDeleteAccountFlow } from '@/hooks/use-delete-account-flow'

export type DeleteAccountDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Main coordinator component for the account deletion flow
 * Manages the state machine and renders appropriate dialogs
 */
export const DeleteAccountDialog: FC<DeleteAccountDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const {
    state,
    openDialog,
    closeDialog,
    proceedToFinal,
    goBackToWarning,
    confirmDeletion,
    isDeleting,
    error,
  } = useDeleteAccountFlow()

  // Sync external open prop with internal state
  useEffect(() => {
    if (open && state === 'closed') {
      openDialog()
    } else if (!open && state !== 'closed') {
      closeDialog()
    }
  }, [open, state, openDialog, closeDialog])

  // Notify parent when dialog is closed internally (only from first warning cancel)
  const handleFirstWarningClose = () => {
    closeDialog()
    onOpenChange(false)
  }

  // For final confirmation, just go back to first warning (don't close entirely)
  const handleFinalConfirmationCancel = () => {
    goBackToWarning()
  }

  return (
    <>
      <DeleteAccountFirstWarning
        onCancel={handleFirstWarningClose}
        onContinue={proceedToFinal}
        open={state === 'first-warning'}
      />

      <DeleteAccountFinalConfirmation
        error={error}
        isDeleting={isDeleting}
        onCancel={handleFinalConfirmationCancel}
        onConfirm={confirmDeletion}
        open={state === 'final-confirmation' || state === 'deleting'}
      />

      <DeleteAccountSuccess open={state === 'success'} />
    </>
  )
}

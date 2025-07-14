import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui";

interface AlertModalProps {
  showDeleteDialog: boolean;
  setShowDeleteDialog: (show: boolean) => void;
  handleDeleteConfirm: () => void;
  title: string;
  description: string;
  children?: React.ReactNode;
}
const AlertModal = ({
  showDeleteDialog,
  setShowDeleteDialog,
  handleDeleteConfirm,
  title,
  description,
  children
}: AlertModalProps) => {
  return (
    <>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {children}
    </>
  )
}

export default AlertModal;

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteMessageDialog = ({
  isOpen,
  onClose,
  onConfirm,
}: DeleteMessageDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-cyberdark-900 border border-cybergold-500/30">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-cybergold-100">Slett melding</AlertDialogTitle>
          <AlertDialogDescription className="text-cyberblue-300">
            Er du sikker på at du vil slette denne meldingen? Dette kan ikke angres.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-cyberdark-800 text-cybergold-200 hover:bg-cyberdark-700">
            Avbryt
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-900 hover:bg-red-800 text-white"
          >
            Slett
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

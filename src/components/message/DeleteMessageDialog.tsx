
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

interface DeleteMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteMessageDialog = ({ isOpen, onClose, onConfirm }: DeleteMessageDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-cyberdark-900 border-cybergold-500/30">
        <DialogHeader>
          <DialogTitle className="text-cybergold-300">Slett melding</DialogTitle>
          <DialogDescription className="text-cyberdark-300">
            Er du sikker på at du vil slette denne meldingen? Dette kan ikke angres.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-cybergold-500/30 text-cybergold-300"
          >
            Avbryt
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="bg-red-900 hover:bg-red-800 text-white border-none"
          >
            Slett
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
